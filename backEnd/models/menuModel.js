const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Breakfast", "Lunch", "Dinner", "Dessert", "Drink", "Tea"],
      required: true,
    },
    image: { type: String, required: true },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
