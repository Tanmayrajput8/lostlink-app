// NEW: Notification routes
const express = require("express");
const {
  getNotifications, markAllRead, markOneRead,
  deleteNotification, getUnreadCount
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markOneRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
