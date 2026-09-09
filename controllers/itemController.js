const Item = require("../models/items");
const Claim = require("../models/claim");
const { findMatchesForItem } = require("../utils/matching");
const mongoose = require("mongoose");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET all visible approved items (browse catalog)
async function getItems(req, res, next) {
  try {
    const { search, category, type } = req.query;

    const filter = { status: "approved" };

    if (type && ["lost", "found"].includes(type)) {
      filter.type = type;
    }
    if (category && category !== "All" && category.trim() !== "") {
      filter.category = category;
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
}

// GET system statistics (for landing page & dashboard)
async function getItemStats(req, res, next) {
  try {
    const totalItems = await Item.countDocuments();
    const approvedCount = await Item.countDocuments({ status: "approved" });
    const pendingReports = await Item.countDocuments({ status: "pending" });
    const resolvedCount = await Item.countDocuments({ status: "returned" });
    const pendingClaims = await Claim.countDocuments({ status: "pending" });

    res.json({
      success: true,
      stats: {
        totalItems,
        approvedCount,
        activeCount: approvedCount,
        pendingReports,
        resolvedCount,
        returnedCount: resolvedCount,
        pendingClaims,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET single item by ID
async function getItemById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const isOwner = item.reporterID && req.user && item.reporterID.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";
    if (item.status !== "approved" && !isOwner && !isAdmin) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

// GET current user's reported items
async function getMyItems(req, res, next) {
  try {
    const items = await Item.find({ reporterID: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
}

// POST submit new item report (lost or found)
// Status: pending for regular users, approved for admin
async function addItem(req, res, next) {
  try {
    const { title, type, category, location, date, time, description, phone, linkedLostItem } = req.body;

    const isAdmin = req.user && req.user.role === "admin";
    const initialStatus = isAdmin ? "approved" : "pending";

    const itemData = {
      title: title.trim(),
      type,
      category: category ? category.trim() : "Other",
      location: location.trim(),
      date,
      time: time ? time.trim() : "",
      description: description.trim(),
      reporterID: req.user._id,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
      reporterPhone: phone ? phone.trim() : req.user.phone || "",
      image: req.file ? req.file.filename : null,
      status: initialStatus,
    };

    // If this found report is linked to an original lost report
    if (linkedLostItem && isValidObjectId(linkedLostItem)) {
      itemData.linkedLostItem = linkedLostItem;
    }

    const newItem = new Item(itemData);
    await newItem.save();

    const responseMessage = isAdmin
      ? "Item published successfully!"
      : "Item submitted successfully and is pending administrator review.";

    return res.status(201).json({
      success: true,
      message: responseMessage,
      item: newItem,
    });
  } catch (error) {
    next(error);
  }
}

// POST "I Found This Item" — creates a linked found report from a lost item
async function foundThisItem(req, res, next) {
  try {
    const { id } = req.params; // ID of the original lost item

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }

    const lostItem = await Item.findById(id);

    if (!lostItem) {
      return res.status(404).json({ success: false, message: "Original lost item not found" });
    }

    if (lostItem.type !== "lost") {
      return res.status(400).json({ success: false, message: "This item is not a lost item report" });
    }

    if (lostItem.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "This lost item report is not publicly active. Cannot link a found report to it.",
      });
    }

    // Prevent the original reporter from claiming they found their own item
    if (lostItem.reporterID && req.user._id.toString() === lostItem.reporterID.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot report finding your own lost item.",
      });
    }

    const { location, date, time, description, phone } = req.body;

    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: "Location where item was found is required" });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: "Date found is required" });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });
    }

    const isAdmin = req.user.role === "admin";

    const newFoundItem = new Item({
      title: lostItem.title,        // Reuse title from original lost report
      type: "found",
      category: lostItem.category,  // Reuse category
      location: location.trim(),
      date,
      time: time ? time.trim() : "",
      description: description.trim(),
      reporterID: req.user._id,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
      reporterPhone: phone ? phone.trim() : req.user.phone || "",
      image: req.file ? req.file.filename : null,
      status: isAdmin ? "approved" : "pending",
      linkedLostItem: lostItem._id,  // Link back to original lost report
    });

    await newFoundItem.save();

    return res.status(201).json({
      success: true,
      message: isAdmin
        ? "Found item report published and linked to the original lost report."
        : "Found item report submitted successfully. It will be visible after admin review.",
      item: newFoundItem,
    });
  } catch (error) {
    next(error);
  }
}

// GET pending items for Admin review
async function getPendingItemsAdmin(req, res, next) {
  try {
    const items = await Item.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
}

// GET all items for Admin moderation
async function getAllItemsAdmin(req, res, next) {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
}

// PUT Admin approve item report
async function approveItem(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    if (item.status === "approved") {
      return res.status(400).json({ success: false, message: "Item is already approved." });
    }

    item.status = "approved";
    await item.save();

    res.json({ success: true, message: "Item report approved and is now visible to the public.", item });
  } catch (error) {
    next(error);
  }
}

// PUT Admin reject item report
async function rejectItem(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    item.status = "rejected";
    await item.save();

    res.json({ success: true, message: "Item report rejected.", item });
  } catch (error) {
    next(error);
  }
}

// PUT Admin mark item as returned (physical handover complete)
// Also marks any approved claims for this item as completed
async function markReturned(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    if (item.status === "returned") {
      return res.status(400).json({ success: false, message: "Item is already marked as returned." });
    }

    item.status = "returned";
    await item.save();

    // Mark all approved claims for this item as completed
    await Claim.updateMany(
      { itemId: item._id, status: "approved" },
      { status: "completed" }
    );

    res.json({ success: true, message: "Item marked as returned. All approved claims updated to completed.", item });
  } catch (error) {
    next(error);
  }
}

// DELETE item — owner or admin only (hard delete)
async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const isOwner = item.reporterID && item.reporterID.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this item" });
    }

    await Item.findByIdAndDelete(id);

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// GET /api/items/:id/matches — Find potential matches for an item
async function getItemMatches(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Match against the opposite type: lost→found, found→lost
    const targetType = item.type === "lost" ? "found" : "lost";

    const candidates = await Item.find({
      type: targetType,
      status: "approved",
    }).sort({ createdAt: -1 });

    const matches = findMatchesForItem(item, candidates, 20);

    return res.json({
      success: true,
      item: {
        _id: item._id,
        title: item.title,
        type: item.type,
        category: item.category,
        location: item.location,
      },
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getItems,
  getItemStats,
  getItemById,
  getMyItems,
  addItem,
  foundThisItem,
  getPendingItemsAdmin,
  getAllItemsAdmin,
  approveItem,
  rejectItem,
  markReturned,
  deleteItem,
  getItemMatches,
};
