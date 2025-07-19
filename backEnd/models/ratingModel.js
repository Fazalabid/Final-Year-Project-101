// models/rating.model.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ratingSchema.index({ user: 1, menuItem: 1 }, { unique: true }); // prevent duplicate ratings

module.exports = mongoose.model("Rating", ratingSchema);
