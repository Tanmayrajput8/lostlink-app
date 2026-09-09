const express = require("express");
const path = require("path");

// Route imports
const authRoutes = require("./routes/authroutes");
const itemRoutes = require("./routes/itemroutes");
const claimRoutes = require("./routes/claimroutes");
const notificationRoutes = require("./routes/notificationroutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

// Serve static assets (CSS, JS, images) from public/
app.use(express.static(path.join(__dirname, "public")));

// Serve HTML view files from views/
app.use(express.static(path.join(__dirname, "views")));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTML Page Routes (supporting clean URLs and standard paths)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/items", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "items.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/report-lost", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "report-lost.html"));
});

app.get("/report-found", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "report-found.html"));
});

app.get("/claim", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "claim.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "LostLink API is healthy" });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);

// 404 Route Handler for undefined routes
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).sendFile(path.join(__dirname, "views", "index.html"));
  }
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found",
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("API Error:", err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this information already exists.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  // CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format provided";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

module.exports = app;
