const Table = require("../models/tableModel");
const Booking = require("../models/bookingModel");

// Updated controller for /api/tables/available
// controller function for available tables
exports.getAvailableTables = async (req, res) => {
  const { date, time, guests } = req.query;

  if (!date || !time || !guests) {
    return res.status(400).json({ message: "Missing date, time, or guests" });
  }

  try {
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid date or time format." });
    }
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2-hour duration

    // Find overlapping bookings
    const overlappingBookings = await Booking.find({
      reservationStart: { $lt: end },
      reservationEnd: { $gt: start },
    }).select("table");

    const bookedTableIds = overlappingBookings.map((b) => b.table.toString());

    // Find available tables: Not booked, Has enough capacity, AND status is "Available"
    const availableTables = await Table.find({
      capacity: { $gte: guests },
      status: "Available",
      _id: { $nin: bookedTableIds },
    });

    res.json(availableTables);
  } catch (err) {
    console.error("Error checking table availability:", err);
    res
      .status(500)
      .json({ message: "Error checking availability", error: err.message });
  }
};

// Create Table
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    const exists = await Table.findOne({ tableNumber });
    if (exists) {
      return res.status(400).json({ message: "Table already exists" });
    }

    const table = await Table.create({ tableNumber, capacity, status });
    res.status(201).json(table);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating table", error: err.message });
  }
};

// Get All Tables
exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching tables", error: err.message });
  }
};

// Update Table
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    const { tableNumber, capacity, status } = req.body;
    table.tableNumber = tableNumber || table.tableNumber;
    table.capacity = capacity || table.capacity;
    table.status = status || table.status;

    await table.save();
    res.json(table);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating table", error: err.message });
  }
};

// Delete Table
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndDelete(id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ message: "Table deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting table", error: err.message });
  }
};
