const { body } = require("express-validator");
const { handleValidationErrors } = require("./authValidator");
const mongoose = require("mongoose");

// Claim creation validation
const createClaimValidator = [
  (req, res, next) => {
    delete req.body.status;
    delete req.body.adminNote;
    next();
  },

  body("itemId")
    .notEmpty().withMessage("Item ID is required")
    .custom((val) => {
      if (!mongoose.Types.ObjectId.isValid(val)) {
        throw new Error("Invalid Item ID format");
      }
      return true;
    }),

  body("description")
    .trim()
    .notEmpty().withMessage("Claim description is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Description must be at least 10 characters"),

  body("uniqueFeature")
    .trim()
    .notEmpty().withMessage("Unique distinguishing feature is required")
    .isLength({ min: 5, max: 500 }).withMessage("Unique feature must be at least 5 characters"),

  body("contactPhone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{10}$/).withMessage("Contact phone must be a valid 10-digit number"),

  handleValidationErrors,
];

module.exports = { createClaimValidator };
