const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "withdrawn"],
      default: "pending",
      index: true,
    },

    // Claim form fields
    description: {
      type: String,
      required: [true, "Claim description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    uniqueFeature: {
      type: String,
      required: [true, "Unique distinguishing feature is required"],
      trim: true,
      minlength: [5, "Unique feature must be at least 5 characters"],
      maxlength: [500, "Unique feature cannot exceed 500 characters"],
    },
    lostDate: {
      type: Date,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    proofImage: {
      type: String,
    },

    // Snapshot captured at claim creation time — survives deletion
    itemSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    claimerSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Admin actions
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: Date,
    withdrawnAt: Date,

    // Legacy notification fields
    notificationMessage: String,
    notifiedAt: Date,
  },
  { timestamps: true }
);

// Compound index to quickly find user claims per item
claimSchema.index({ itemId: 1, userId: 1, status: 1 });
claimSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);
