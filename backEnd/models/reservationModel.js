const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    notes: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
