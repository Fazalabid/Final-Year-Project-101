const Reservation = require("../models/reservationModel");

// Create Reservation
exports.createReservation = async (req, res) => {
  try {
    const reservation = new Reservation({
      ...req.body,
      userId: req.user?.id, // optional
    });

    await reservation.save();
    res.status(201).json(reservation);
  } catch (error) {
    res.status(400).json({ message: "Failed to create reservation", error });
  }
};

// Get all reservations (admin)
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reservations" });
  }
};

// Get reservations by user (optional)
exports.getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your reservations" });
  }
};

// Delete a reservation
exports.deleteReservation = async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting reservation" });
  }
};
