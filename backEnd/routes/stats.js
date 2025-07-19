// routes/stats.js
const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const Reservation = require("../models/reservationModel");
const MenuItem = require("../models/menuModel");

router.get("/admin/stats", async (req, res) => {
  try {
    const [totalOrders, totalReservations, totalMenuItems] = await Promise.all([
      Order.countDocuments(),
      Reservation.countDocuments(),
      MenuItem.countDocuments(),
    ]);

    res.json({ totalOrders, totalReservations, totalMenuItems });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
