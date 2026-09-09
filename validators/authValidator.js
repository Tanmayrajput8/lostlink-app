const { body, validationResult } = require("express-validator");

// Handle validation errors and return JSON response
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return res.status(422).json({
      success: false,
      message: firstError,
    });
  }
  next();
};

// Register input validation
const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Name should not contain numbers or special characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{10}$/).withMessage("Phone number must be 10 digits"),

  handleValidationErrors,
];

// Login input validation
const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  handleValidationErrors,
};
