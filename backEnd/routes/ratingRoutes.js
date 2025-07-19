// routes/rating.routes.js
const express = require("express");
const router = express.Router();
const {
  rateMenuItem,
  getUserRatings,
} = require("../controllers/ratingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/:menuItemId", protect, rateMenuItem);
router.get("/", protect, getUserRatings);

module.exports = router;
