const { body } = require("express-validator");
const { handleValidationErrors } = require("./authValidator");

const VALID_CATEGORIES = [
  "Electronics",
  "Wallet",
  "Keys",
  "Bag",
  "Clothing",
  "Books",
  "Jewellery",
  "ID",
  "Sports",
  "Other",
];

// Create item validation
const createItemValidator = [
  // Remove fields users should not set
  (req, res, next) => {
    delete req.body.status;
    delete req.body.isDeleted;
    next();
  },

  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),

  body("type")
    .trim()
    .notEmpty().withMessage("Item type is required")
    .isIn(["lost", "found"]).withMessage("Type must be 'lost' or 'found'"),

  body("category")
    .trim()
    .notEmpty().withMessage("Category is required")
    .isLength({ min: 2, max: 50 }).withMessage("Category must be between 2 and 50 characters"),

  body("location")
    .trim()
    .notEmpty().withMessage("Location is required")
    .isLength({ min: 2, max: 200 }).withMessage("Location must be between 2 and 200 characters"),

  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Please provide a valid date"),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be at least 10 characters"),

  handleValidationErrors,
];

module.exports = {
  createItemValidator,
  VALID_CATEGORIES,
};
