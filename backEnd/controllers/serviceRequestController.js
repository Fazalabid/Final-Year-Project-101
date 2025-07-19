const Booking = require("../models/bookingModel");
const ServiceRequest = require("../models/serviceRequestModel");

exports.createServiceRequest = async (req, res) => {
  try {
    const graceMs = 10 * 60 * 1000; // 10 minutes

    const now = new Date();
    const activeRequests = await ServiceRequest.countDocuments({
      user: req.user._id,
      status: "Pending",
    });

    if (activeRequests >= 3) {
      return res.status(429).json({
        message:
          "You've reached the maximum of 3 active service requests. Please wait until one is completed or cancelled.",
      });
    }

    const booking = await Booking.findOne({
      user: req.user._id,
      reservationStart: { $lte: new Date(now.getTime() + graceMs) },
      reservationEnd: { $gte: new Date(now.getTime() - graceMs) },
    });
    if (!booking) {
      return res.status(403).json({
        message:
          "You can only make a service request during your active reservation.",
      });
    }

    const { type, note } = req.body;

    const request = await ServiceRequest.create({
      user: req.user._id,
      booking: booking._id,
      type,
      note,
      status: "Pending",
      createdAt: now,
    });

    res.status(201).json({ message: "Request submitted", request });
  } catch (err) {
    console.error("Service request error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating request", error });
  }
};

exports.getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ user: req.user._id })
      .populate({
        path: "booking",
        populate: {
          path: "table",
          select: "tableNumber", // whatever fields you want to show
        },
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("Fetch requests failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Admin: Get all service requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate({
        path: "booking",
        populate: {
          path: "table",
          select: "tableNumber", // whatever fields you want to show
        },
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error("Failed to fetch service requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.markRequestAsCompleted = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "Completed";
    request.completedAt = new Date(); // 🕒 timestamp for deletion check
    await request.save();

    res.status(200).json({ message: "Request marked as completed" });
  } catch (err) {
    console.error("Error marking request as completed:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.deleteMyRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "Pending",
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Request not found or already processed" });
    }

    await ServiceRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Request cancelled successfully" });
  } catch (err) {
    console.error("❌ Error cancelling request:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a service request (admin only)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request deleted successfully" });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({ message: "Failed to delete request" });
  }
};
