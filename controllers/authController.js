const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "lostlink_secret_key_123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helper to sign JWT token and send response
const sendAuthResponse = (user, statusCode, res, message) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role === "student" ? "user" : user.role,
      phone: user.phone || "",
    },
  });
};

// Register a new user
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = (email || "").toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      role: "user",
    });

    await user.save();

    sendAuthResponse(user, 201, res, "Registration successful!");
  } catch (error) {
    next(error);
  }
}

// Login user
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendAuthResponse(user, 200, res, "Login successful!");
  } catch (error) {
    next(error);
  }
}

// Get current logged-in user profile
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role === "student" ? "user" : user.role,
        phone: user.phone || "",
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get all users (Admin only)
async function getUsers(req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  getUsers,
};
