const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, optionalAuth, adminOnly } = require("../middleware/authMiddleware");

// Public can view categories, or authenticated user
router.get("/", optionalAuth, categoryController.getCategories);

// Admin can create and delete categories
router.post("/", protect, adminOnly, categoryController.createCategory);
router.delete("/:id", protect, adminOnly, categoryController.deleteCategory);

module.exports = router;
