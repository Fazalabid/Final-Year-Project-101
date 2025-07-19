const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  type: {
    type: String,
    enum: ["Water", "Napkin", "Bill", "Other"],
    required: true,
  },
  note: { type: String },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
  completedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
