const mongoose = require("mongoose");

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

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Item type (lost/found) is required"],
      index: true,
    },
    category: {
      type: String,
      default: "Other",
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    time: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },

    // Reporter info snapshot (stored at creation, survives user deletion)
    reporterID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reporterName: { type: String, trim: true },
    reporterEmail: { type: String, trim: true },
    reporterPhone: { type: String, trim: true },

    image: { type: String },

    // Only 4 valid statuses as per business logic
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "returned"],
      default: "pending",
      index: true,
    },

    // Link from a Found report back to the original Lost report
    // Set when a user clicks "I Found This Item" on a Lost Item
    linkedLostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for common query patterns
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Item", itemSchema);
