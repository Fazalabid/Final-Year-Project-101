const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Order = require("../models/orderModel");

exports.generateInvoicePDF = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.menuItem");

    if (!order) return res.status(404).send("Order not found");

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order._id}.pdf`
    );

    doc.pipe(res);

    // ✅ Insert Logo (adjust path to match your project)
    const logoPath = path.join(__dirname, "../../assets/img/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 220, 20, { width: 150 }); // centerish
      doc.moveDown(4); // create some space after the image
    } else {
      console.warn("Logo not found at:", logoPath);
      doc.moveDown(2);
    }

    // ✅ Invoice Title
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    // ✅ Order Summary
    doc.fontSize(12);
    doc.text(`Invoice ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.moveDown();

    // ✅ Customer Details
    doc.fontSize(14).text("Customer Details", { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${order.customerName}`);
    doc.text(`Email: ${order.user?.email || "N/A"}`);
    doc.text(`Phone: ${order.phone}`);
    doc.text(`Address: ${order.address}`);
    doc.moveDown();

    // ✅ Order Status & Payment
    doc.fontSize(14).text("Order Details", { underline: true });
    doc.fontSize(12);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Split Between: ${order.splitBetween} people`);
    doc.text(`Per Person Amount: Rs ${order.perPersonAmount}`);
    doc.moveDown();

    // ✅ Item List
    doc.fontSize(14).text("Items Ordered", { underline: true });
    doc.fontSize(12);
    order.items.forEach((item, index) => {
      const name = item.menuItem?.title || "Unknown Item";
      const price = item.menuItem?.price || 0;
      const qty = item.quantity;
      const total = price * qty;

      doc.text(`${index + 1}. ${name} - Rs ${price} x ${qty} = Rs ${total}`);
    });

    doc.moveDown();

    // ✅ Pricing Summary
    doc.fontSize(14).text("Pricing Summary", { underline: true });
    doc.fontSize(12);
    doc.text(`Tax: Rs ${order.tax}`);
    doc.text(`Total: Rs ${order.totalPrice}`);

    // ✅ Footer
    doc.moveDown().fontSize(10).text("Thank you for dining with BooknBite!", {
      align: "center",
    });

    doc.end();
  } catch (err) {
    console.error("Invoice generation failed:", err);
    res.status(500).send("Error generating invoice.");
  }
};
