const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    guests: { type: Number, required: true },
    // date: {
    //   type: String, // stored as "YYYY-MM-DD"
    //   required: true,
    // },
    // time: {
    //   type: String, // stored as "HH:mm"
    //   required: true,
    // },
    specialRequest: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Cancelled"],
      default: "Pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table", // <-- This is what was missing
      required: true,
    },
    reservationStart: {
      type: Date,
      required: true,
    },
    reservationEnd: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
