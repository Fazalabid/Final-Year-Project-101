const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  submitFeedback,
  getAllFeedbacks,
  deleteFeedback,
} = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", protect, submitFeedback);
router.get("/", protect, adminOnly, getAllFeedbacks);
router.delete("/:id", protect, adminOnly, deleteFeedback);

module.exports = router;
