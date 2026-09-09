const Claim = require("../models/claim");
const Item = require("../models/items");
const mongoose = require("mongoose");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// POST Submit new claim (User only — found items only)
async function addClaim(req, res, next) {
  try {
    const { itemId, description, uniqueFeature, lostDate, contactPhone } = req.body;
    const proofImage = req.file ? req.file.filename : null;

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or no longer available",
      });
    }

    // RULE 1: Only FOUND items can be claimed
    if (item.type !== "found") {
      return res.status(400).json({
        success: false,
        message: "Only found items can be claimed. Lost item reports cannot be claimed.",
      });
    }

    // RULE 2: Item must be approved (not pending, rejected, or returned)
    if (item.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          item.status === "returned"
            ? "This item has already been returned and is no longer available for claims."
            : "This item is not yet approved for claims.",
      });
    }

    // RULE 3: User cannot claim their own found item
    if (item.reporterID && req.user._id.toString() === item.reporterID.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot claim an item reported by you.",
      });
    }

    // RULE 4: Admin cannot claim items
    if (req.user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrators cannot submit claims.",
      });
    }

    // RULE 5: Prevent duplicate claims by same user
    const existingClaim = await Claim.findOne({
      itemId,
      userId: req.user._id,
      status: { $in: ["pending", "approved"] },
    });
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a claim for this item.",
      });
    }

    // Create the claim
    const claim = new Claim({
      itemId,
      userId: req.user._id,
      description: description.trim(),
      uniqueFeature: uniqueFeature.trim(),
      lostDate: lostDate ? new Date(lostDate) : null,
      contactPhone: contactPhone ? contactPhone.trim() : "",
      proofImage,
      itemSnapshot: {
        title: item.title,
        type: item.type,
        category: item.category,
        location: item.location,
      },
      claimerSnapshot: {
        name: req.user.name,
        email: req.user.email,
      },
      status: "pending",
    });

    await claim.save();

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully. It is now pending administrator review.",
      claim,
    });
  } catch (error) {
    next(error);
  }
}

// GET user's own claims
async function getMyClaims(req, res, next) {
  try {
    const claims = await Claim.find({ userId: req.user._id })
      .populate("itemId", "title type category location image status")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: claims.length, claims });
  } catch (error) {
    next(error);
  }
}

// GET all claims (Admin only)
async function getClaims(req, res, next) {
  try {
    const claims = await Claim.find()
      .populate("itemId", "title type category location image status reporterName")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: claims.length, claims });
  } catch (error) {
    next(error);
  }
}

// PUT Admin approve claim
// NOTE: Approving a claim does NOT mark the item as returned.
// The item stays "approved" until admin separately calls markReturned
// after the physical handover has occurred.
async function approveClaim(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid claim ID" });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.status === "approved") {
      return res.status(400).json({ success: false, message: "Claim is already approved." });
    }

    if (claim.status === "completed") {
      return res.status(400).json({ success: false, message: "Claim is already completed." });
    }

    const item = await Item.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Associated item not found." });
    }

    // Approve the claim — item stays "approved" until physical handover
    claim.status = "approved";
    claim.approvedBy = req.user._id;
    claim.approvedAt = new Date();
    await claim.save();

    // Reject all other pending claims for this item (only one can be approved)
    await Claim.updateMany(
      { itemId: claim.itemId, _id: { $ne: claim._id }, status: "pending" },
      {
        status: "rejected",
        rejectionReason: "Another claim has been verified and approved.",
        rejectedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Claim approved. When the item has been physically handed over, mark the item as Returned.",
      claim,
    });
  } catch (error) {
    next(error);
  }
}

// PUT Admin reject claim
async function rejectClaim(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid claim ID" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a reason for rejection" });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.status === "rejected") {
      return res.status(400).json({ success: false, message: "Claim is already rejected." });
    }

    claim.status = "rejected";
    claim.rejectionReason = reason.trim();
    claim.rejectedBy = req.user._id;
    claim.rejectedAt = new Date();
    await claim.save();

    res.json({ success: true, message: "Claim rejected.", claim });
  } catch (error) {
    next(error);
  }
}

// PATCH User withdraw their own pending claim
async function withdrawClaim(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid claim ID" });
    }

    const claim = await Claim.findOne({ _id: id, userId: req.user._id });
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending claims can be withdrawn" });
    }

    claim.status = "withdrawn";
    claim.withdrawnAt = new Date();
    await claim.save();

    res.json({ success: true, message: "Claim withdrawn successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addClaim,
  getMyClaims,
  getClaims,
  approveClaim,
  rejectClaim,
  withdrawClaim,
};
