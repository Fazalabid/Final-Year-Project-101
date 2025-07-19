const express = require("express");
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  generateBookingPDF,
  getActiveBooking,
  updateBooking,
  getBookingById,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();
router.post("/", protect, createBooking);

//route to check active booking for service requests feature
router.get("/active", protect, getActiveBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/:id", protect, adminOnly, getBookingById);
router.get("/", protect, adminOnly, getAllBookings);
router.get("/:id/invoice", protect, generateBookingPDF);

router.patch("/:id/status", protect, adminOnly, updateBookingStatus);
router.patch("/:id/cancel", protect, cancelBooking);
router.put("/:id", protect, adminOnly, updateBooking);

router.delete("/:id", protect, deleteBooking);

module.exports = router;
