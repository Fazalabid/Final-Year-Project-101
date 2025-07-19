const Order = require("../models/orderModel");
const sendEmail = require("../config/email");

const Menu = require("../models/menuModel");
// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({ path: "user", select: "name email" }) // short form for user
      .populate({ path: "items.menuItem", model: "MenuItem" });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({ path: "user", select: "name email" }) // short form for user
      .populate({ path: "items.menuItem", model: "MenuItem" });

    res.json(order || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
//Get order by user ID (admin)
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).populate(
      "items.menuItem"
    );
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders." });
  }
};

// Get orders for logged-in user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(
      "items.menuItem"
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your orders" });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(id);

    res.json({ message: "✅ Order deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting order:", err);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Order update failed" });
  }
};

// // Example usage per item in order
// await reduceStock("Burger", 1); // you can map this to real items

// Util for calculating bill
const calculateTotalBill = (items, menuItems, splitBetween = 1) => {
  let subtotal = 0;

  items.forEach((orderItem) => {
    const menuItem = menuItems.find(
      (m) => m._id.toString() === orderItem.itemId
    );
    if (menuItem) {
      subtotal += menuItem.price * orderItem.quantity;
    }
  });

  const taxRate = 0.1;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const perPerson = Number((total / splitBetween).toFixed(2));

  return { subtotal, tax, total, perPerson };
};

// Updated controller

exports.placeOrder = async (req, res) => {
  const {
    customerName,
    email,
    phone,
    address,
    items,
    paymentMethod,
    splitBetween = 1,
  } = req.body;

  try {
    // Fetch all menu items involved
    const menuItemIds = items.map((item) => item.menuItem);
    const menuItems = await Menu.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== items.length) {
      return res
        .status(400)
        .json({ message: "Some menu items are invalid or missing" });
    }

    // Calculate subtotal
    let subtotal = 0;
    items.forEach((item) => {
      const matchedItem = menuItems.find(
        (menu) => menu._id.toString() === item.menuItem
      );
      if (matchedItem) {
        subtotal += matchedItem.price * item.quantity;
      }
    });

    // Calculate tax, total, per person
    const taxRate = 0.1;
    const tax = subtotal * taxRate;
    const totalPrice = subtotal + tax;
    const perPersonAmount = Number((totalPrice / splitBetween).toFixed(2));

    // Now create the order with all calculated fields
    const order = await Order.create({
      customerName,
      email,
      phone,
      address,
      items,
      totalPrice,
      tax,
      perPersonAmount,
      splitBetween,
      paymentMethod,
      user: req.user._id,
    });
    // Assuming orderItems = [{ menuItem: ObjectId, quantity: 2 }, ...]
    for (const item of req.body.items) {
      const menu = await Menu.findById(item.menuItem);

      if (!menu) continue;

      menu.stock -= item.quantity;
      if (menu.stock <= 0) {
        menu.stock = 0;
        menu.available = false; // optional
      }

      await menu.save();
    }

    // Send email to customer
    const populatedOrder = await Order.findById(order._id).populate(
      "items.menuItem",
      "title price"
    );
    const message = `
  <h3>Hi ${req.user.name},</h3>
  <p>Thank you for your order with BooknBite!</p>
  <p><strong>Order ID:</strong> ${order._id}</p>
  <p><strong>Customer Name:</strong> ${order.customerName}</p>
  <p><strong>Email:</strong> ${order.email}</p>
  <p><strong>Phone:</strong> ${order.phone}</p>
  <p><strong>Address:</strong> ${order.address}</p>
  <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
  <p><strong>Order Summary:</strong></p>
  <ul>
    ${populatedOrder.items
      .map(
        (item) =>
          `<li>${item.menuItem.title} - ${item.quantity}x (Rs. ${
            item.menuItem.price * item.quantity
          })</li>`
      )
      .join("")}
  </ul>
  <p><strong>Split Between: ${order.splitBetween}</strong></p>
  <p><strong>Tax (10%): Rs. ${order.tax}</strong></p>
  <p><strong>Subtotal: Rs. ${order.totalPrice - order.tax}</strong></p>
  <p><strong>Total: Rs. ${order.totalPrice}</strong></p>
  <p><strong>Per Person Amount: Rs. ${order.perPersonAmount}</strong></p>
  <p>We'll get your food ready shortly. 🍽️</p>
`;

    try {
      await sendEmail({
        email: req.user.email,
        subject: "Your BooknBite Order Confirmation",
        message,
      });
    } catch (error) {
      console.error("Order email failed:", error);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Order placement failed:", err);
    res
      .status(400)
      .json({ message: "Order creation failed", error: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found." });

    res.json({ message: "Order cancelled successfully." });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ message: "Failed to cancel order." });
  }
};
