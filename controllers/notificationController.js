const Notification = require("../models/notification");
const mongoose = require("mongoose");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function createNotification(userID, type, title, message, itemID = null, claimID = null) {
  try {
    await Notification.create({ userID, type, title, message, itemID, claimID });
  } catch (err) {
    console.error("Notification create error:", err.message);
  }
}

// GET /api/notifications — current user's notifications (newest first, max 100)
async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userID: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all — mark all as read
async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userID: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read — mark one as read
async function markOneRead(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userID: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification marked as read", notification });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notifications/:id
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userID: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
}

// GET unread count (used by navbar bell)
async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ userID: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
  getUnreadCount,
};
