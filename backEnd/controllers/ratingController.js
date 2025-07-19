// controllers/rating.controller.js
const Rating = require("../models/ratingModel");

exports.rateMenuItem = async (req, res) => {
  const { rating } = req.body;
  const menuItemId = req.params.menuItemId;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating value." });
  }

  try {
    const existing = await Rating.findOne({
      user: userId,
      menuItem: menuItemId,
    });

    if (existing) {
      // Update existing rating
      existing.rating = rating;
      await existing.save();
      return res
        .status(200)
        .json({ message: "Rating updated.", rating: existing });
    }

    // Create new rating
    const newRating = await Rating.create({
      user: userId,
      menuItem: menuItemId,
      rating,
    });

    res.status(201).json({ message: "Rating submitted.", rating: newRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit rating." });
  }
};
exports.getUserRatings = async (req, res) => {
  try {
    const userId = req.user._id;
    const ratings = await Rating.find({ user: userId }).select(
      "menuItem rating"
    );
    res.status(200).json(ratings);
  } catch (err) {
    console.error("Failed to fetch ratings:", err);
    res.status(500).json({ message: "Error fetching ratings" });
  }
};
