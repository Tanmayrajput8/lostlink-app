const express = require("express");
const itemController = require("../controllers/itemController");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createItemValidator } = require("../validators/itemValidator");

const router = express.Router();

// Public routes
router.get("/", optionalAuth, itemController.getItems);
router.get("/stats/summary", itemController.getItemStats);

// User protected routes
router.get("/mine", protect, itemController.getMyItems);
router.post(
  "/",
  protect,
  upload.single("image"),
  createItemValidator,
  itemController.addItem
);

// Admin protected routes — MUST come before /:id to avoid route collision
router.get("/admin/all", protect, adminOnly, itemController.getAllItemsAdmin);
router.get("/admin/pending", protect, adminOnly, itemController.getPendingItemsAdmin);
router.put("/:id/approve", protect, adminOnly, itemController.approveItem);
router.put("/:id/reject", protect, adminOnly, itemController.rejectItem);
router.put("/:id/return", protect, adminOnly, itemController.markReturned);

// "I Found This Item" — authenticated user submits a found report linked to a lost item
router.post("/:id/found", protect, upload.single("image"), itemController.foundThisItem);

// Matches route — MUST come before /:id
router.get("/:id/matches", optionalAuth, itemController.getItemMatches);

// Parameterized routes — MUST come after all specific named routes
router.get("/:id", optionalAuth, itemController.getItemById);
router.delete("/:id", protect, itemController.deleteItem);

module.exports = router;
