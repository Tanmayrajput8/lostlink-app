const express = require("express");
const {
  register,
  login,
  getMe,
  getUsers,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  registerValidator,
  loginValidator,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.get("/me", protect, getMe);
router.get("/users", protect, adminOnly, getUsers);

module.exports = router;
