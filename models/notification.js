const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "claim_submitted",
        "claim_approved",
        "claim_rejected",
        "claim_withdrawn",
        "item_claimed",
        "item_resolved",
        "item_expired",
        "item_deleted",
        "found_report",
        "match_found",
        "general",
      ],
      default: "general",
    },

    itemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    claimID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Auto-expire (TTL index after 30 days)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ userID: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
