const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { protect } = require("../middleware/authMiddleware"); // if you use JWT

// Public (for frontend users)
router.post("/", protect, reservationController.createReservation);
router.get("/my", protect, reservationController.getUserReservations);

// Admin (optional: add admin middleware if needed)
router.get("/", protect, reservationController.getAllReservations);
router.delete("/:id", protect, reservationController.deleteReservation);

module.exports = router;
