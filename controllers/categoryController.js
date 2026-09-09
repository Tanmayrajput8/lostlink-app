const Category = require("../models/category");
const AppError = require("../utils/AppError");

// GET /api/categories - get all active categories (or all if admin)
exports.getCategories = async (req, res, next) => {
  try {
    const filter = req.user && req.user.role === "admin" ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories - admin add new category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return next(new AppError("Category name is required", 400));
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return next(new AppError("Category already exists", 409));
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      icon: icon ? icon.trim() : "tag",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id - admin delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
