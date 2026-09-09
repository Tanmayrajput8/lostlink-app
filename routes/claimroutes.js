const express = require("express");
const {
  addClaim,
  getMyClaims,
  getClaims,
  approveClaim,
  rejectClaim,
  withdrawClaim,
} = require("../controllers/claimController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createClaimValidator } = require("../validators/claimValidator");

const router = express.Router();

// User routes
router.post("/", protect, upload.single("proofImage"), createClaimValidator, addClaim);
router.get("/mine", protect, getMyClaims);
router.patch("/:id/withdraw", protect, withdrawClaim);

// Admin routes
router.get("/", protect, adminOnly, getClaims);
router.put("/:id/approve", protect, adminOnly, approveClaim);
router.put("/:id/reject", protect, adminOnly, rejectClaim);

module.exports = router;
