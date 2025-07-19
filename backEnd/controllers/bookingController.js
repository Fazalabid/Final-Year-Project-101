const Booking = require("../models/bookingModel");
const sendEmail = require("../config/email");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { table } = require("console");

exports.createBooking = async (req, res) => {
  try {
    const { name, email, phone, specialRequest, guests, table } = req.body;
    const { date, time } = req.body;

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hrs

    // Check for overlapping bookings
    const conflict = await Booking.findOne({
      table,
      reservationStart: { $lt: endTime },
      reservationEnd: { $gt: startTime },
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "Table is already booked for that time slot." });
    }

    const booking = await Booking.create({
      name,
      email,
      phone,
      guests,
      specialRequest,
      table,
      reservationStart: startTime,
      reservationEnd: endTime,
      user: req.user._id,
    });

    const message = `
      <h3>Hi ${name},</h3>
      <p>Your table has been successfully booked at BooknBite!</p>
      <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}<br>
      <strong>Time:</strong> ${time}<br>
      <strong>Guests:</strong> ${guests}</p>
    `;
    try {
      await sendEmail({
        email,
        subject: "Your Table Booking Confirmation",
        message,
      });
    } catch (error) {
      console.error("Booking confirmation email failed:", error);
    }

    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("Booking failed:", err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
};

// Get my bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("table")
      .sort({ reservationStart: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch bookings" });
  }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("table");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all bookings" });
  }
};
//Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, guests, table } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Convert to Date objects
    const reservationStart = new Date(`${date}T${time}:00`);
    const reservationEnd = new Date(
      reservationStart.getTime() + 2 * 60 * 60 * 1000
    ); // +2 hours

    // Check for table conflict
    const conflict = await Booking.findOne({
      _id: { $ne: id }, // exclude current booking
      table,
      reservationStart: { $lt: reservationEnd },
      reservationEnd: { $gt: reservationStart },
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "Table is already booked during that time." });
    }

    // Update fields
    booking.reservationStart = reservationStart;
    booking.reservationEnd = reservationEnd;
    booking.guests = guests;
    booking.table = table;

    await booking.save();

    res.json({ message: "Booking updated successfully", booking });
  } catch (err) {
    console.error("Error updating booking:", err);
    res
      .status(500)
      .json({ message: "Failed to update booking", error: err.message });
  }
};

// Update booking status (admin)
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: "Could not update booking" });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: "Cancelled" },
      { new: true }
    );

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    res.json({ message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Failed to cancel booking." });
  }
};
//Delete booking (admin)
exports.deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting booking", err });
  }
};

exports.generateBookingPDF = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("table");

    if (!booking) return res.status(404).send("Booking not found");

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=booking_${booking._id}.pdf`
    );

    doc.pipe(res);

    // ✅ Logo
    const logoPath = path.join(__dirname, "../../assets/img/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 220, 20, { width: 150 });
      doc.moveDown(4);
    }

    // ✅ Header
    doc
      .fontSize(20)
      .text("BooknBite - Booking Confirmation", { align: "center" });
    doc.moveDown();

    // ✅ Booking Info
    doc.fontSize(12);
    doc.text(`Booking ID: ${booking._id}`);
    doc.text(`Date Created: ${new Date(booking.createdAt).toLocaleString()}`);
    doc.moveDown();

    // ✅ Customer Info
    doc.fontSize(14).text("Customer Details", { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${booking.name}`);
    doc.text(`Email: ${booking.email || booking.user?.email || "N/A"}`);
    doc.text(`Phone: ${booking.phone}`);
    doc.moveDown();

    // ✅ Booking Details
    doc.fontSize(14).text("Booking Details", { underline: true });
    doc.fontSize(12);
    doc.text(
      `Date: ${new Date(booking.reservationStart).toLocaleDateString()}`
    );
    doc.text(
      `Time: ${new Date(
        booking.reservationStart
      ).toLocaleTimeString()} - ${new Date(
        booking.reservationEnd
      ).toLocaleTimeString()}`
    );
    doc.text(`Guests: ${booking.guests}`);
    doc.text(`Table Number: ${booking.table.tableNumber}`);
    doc.text(`Table Capacity/Seats: ${booking.table.capacity}`);
    doc.text(`Status: ${booking.status || "Pending"}`);
    if (booking.specialRequest) {
      doc.text(`Special Request: ${booking.specialRequest}`);
    }

    // ✅ Footer
    doc.moveDown().fontSize(10).text("Thank you for booking with BooknBite!", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("Booking PDF generation failed:", err);
    res.status(500).send("Error generating booking confirmation.");
  }
};
// Get active booking for the service request feature
exports.getActiveBooking = async (req, res) => {
  try {
    const now = new Date();
    const graceMs = 10 * 60 * 1000;

    const booking = await Booking.findOne({
      user: req.user._id,
      reservationStart: { $lte: new Date(now.getTime() + graceMs) },
      reservationEnd: { $gte: new Date(now.getTime() - graceMs) },
    }).populate("table");

    if (!booking) {
      return res.status(200).json({ active: false });
    }

    res.status(200).json({ active: true, booking });
  } catch (err) {
    console.error("Get active booking failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("table");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking by ID:", err);
    res
      .status(500)
      .json({ message: "Failed to get booking", error: err.message });
  }
};
