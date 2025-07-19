const express = require("express");
require("dotenv").config();
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe PaymentIntent
router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in paisa (e.g., 5000 = Rs 50)
      currency: "pkr",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
router.get("/stripe", (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});

module.exports = router;
