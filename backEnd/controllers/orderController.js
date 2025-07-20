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
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
      <h2 style="color: #d32f2f;">Hi ${req.user.name},</h2>
      <p>Thank you for your order with <strong>BooknBite</strong>! Here are your order details:</p>
  
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Order ID:</td>
          <td style="padding: 8px;">${order._id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Customer Name:</td>
          <td style="padding: 8px;">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;">${order.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Phone:</td>
          <td style="padding: 8px;">${order.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Address:</td>
          <td style="padding: 8px;">${order.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Payment Method:</td>
          <td style="padding: 8px;">${order.paymentMethod}</td>
        </tr>
      </table>
  
      <h3 style="margin-top: 30px;">Order Summary:</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          ${populatedOrder.items
            .map(
              (item) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    item.menuItem.title
                  }</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${
                    item.quantity
                  }</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${
                    item.menuItem.price * item.quantity
                  }</td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
  
      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Split Between:</td>
          <td style="padding: 8px;">${order.splitBetween}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Tax (10%):</td>
          <td style="padding: 8px;">Rs. ${order.tax}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Subtotal:</td>
          <td style="padding: 8px;">Rs. ${order.totalPrice - order.tax}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total:</td>
          <td style="padding: 8px;">Rs. ${order.totalPrice}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Per Person Amount:</td>
          <td style="padding: 8px;">Rs. ${order.perPersonAmount}</td>
        </tr>
      </table>
  
      <p style="margin-top: 30px;">We'll get your food ready shortly. 🍽️<br>Thanks again for choosing <strong>BooknBite</strong>!</p>
    </div>
  `;

    try {
      await sendEmail(email, "Your BooknBite Order Confirmation", html);
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
