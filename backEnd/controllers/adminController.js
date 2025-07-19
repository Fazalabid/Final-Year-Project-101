const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Booking = require("../models/bookingModel");
const MenuItem = require("../models/menuModel");
const feedback = require("../models/feedbackModel");
const Table = require("../models/tableModel");
const Request = require("../models/serviceRequestModel");
const bcrypt = require("bcryptjs");

exports.getAdminStats = async (req, res) => {
  try {
    const [users, orders, bookings, menuItems, feedbacks, tables, requests] =
      await Promise.all([
        User.countDocuments(),
        Order.countDocuments(),
        Booking.countDocuments(),
        MenuItem.countDocuments(),
        feedback.countDocuments(),
        Table.countDocuments(),
        Request.countDocuments(),
      ]);

    res.json({
      users,
      orders,
      bookings,
      menuItems,
      feedbacks,
      tables,
      requests,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};
// GET /api/admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" });
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};
// PUT /api/admins/:id
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { name, email },
      { new: true }
    );
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
};
// DELETE /api/admins/:id
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete admin" });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Status update failed", error: err.message });
  }
};

// Description: Change a user's role (admin <-> customer)
exports.changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Only allow "admin" or "customer"
  if (!["admin", "customer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role provided" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;

    res.status(200).json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
};
