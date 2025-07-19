const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  placeOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderById,
  getOrdersByUser,
  cancelOrder,
} = require("../controllers/orderController");
const { generateInvoicePDF } = require("../controllers/invoiceController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.get("/", protect, adminOnly, getAllOrders);
router.patch("/:id/update", protect, adminOnly, updateOrderStatus);
router.delete("/:id", protect, adminOnly, deleteOrder);
router.get("/user/:id", protect, getOrdersByUser);
router.patch("/:id/cancel", protect, cancelOrder);
// Get invoice PDF by order ID
router.get("/:id/invoice", protect, generateInvoicePDF);

module.exports = router;
