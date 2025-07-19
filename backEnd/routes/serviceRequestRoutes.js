const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/serviceRequestModel");
const {
  createServiceRequest,
  getMyServiceRequests,
  getAllServiceRequests,
  markRequestAsCompleted,
  deleteRequest,
} = require("../controllers/serviceRequestController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.post("/", protect, createServiceRequest);
router.get("/my", protect, getMyServiceRequests);
router.get("/all", protect, adminOnly, getAllServiceRequests);
router.patch("/:id/complete", protect, adminOnly, markRequestAsCompleted);
router.delete("/:id/delete", protect, adminOnly, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: "Request removed" });
  } catch (err) {
    console.error("Error removing request:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.delete("/:id", protect, adminOnly, deleteRequest);

module.exports = router;
