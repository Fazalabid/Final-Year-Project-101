const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    perPersonAmount: { type: Number },
    splitBetween: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Delivered", "Cancelled"],
      default: "Pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
