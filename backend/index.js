const express = require("express");
const cors = require("cors");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
require("dotenv").config();

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

app.use(
  cors({
    origin: [
      "https://talahashpay.vercel.app",
      "https://talahashpay.com",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "10kb" }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const stkLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many payment attempts. Please try again later.",
  },
});

const speedLimiter = slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 3,
  delayMs: () => 1000,
});

app.use(generalLimiter);

app.get("/", (req, res) => {
  res.send("PayHero backend is live 🚀");
});

const formatPhone = (phone) => {
  let formattedPhone = String(phone).trim();

  if (formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.slice(1);
  }

  if (formattedPhone.startsWith("254")) {
    formattedPhone = "0" + formattedPhone.slice(3);
  }

  return formattedPhone;
};

const isValidKenyanPhone = (phone) => {
  return /^0(7|1)\d{8}$/.test(phone);
};

const cleanReference = (reference) => {
  if (!reference) return `PAY-${Date.now()}`;

  return String(reference)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 40);
};

/* ------------------ PAYHERO PAYMENT ------------------ */
app.post("/payhero-payment", stkLimiter, speedLimiter, async (req, res) => {
  const { phone, amount, reference } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({
      success: false,
      message: "Phone and amount required",
    });
  }

  const formattedPhone = formatPhone(phone);

  if (!isValidKenyanPhone(formattedPhone)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number format",
    });
  }

  const amountNumber = Number(amount);

  if (
    !Number.isFinite(amountNumber) ||
    amountNumber < 1 ||
    amountNumber > 10000
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount",
    });
  }

  try {
    const response = await axios.post(
      "https://api.payhero.africa/api/v2/payments",
      {
        amount: amountNumber,
        phone_number: formattedPhone,
        provider: "m-pesa",
        network_code: "63902",
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        account_id: Number(process.env.PAYHERO_ACCOUNT_ID),
        external_reference: cleanReference(reference),
        callback_url: process.env.PAYHERO_CALLBACK_URL,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.PAYHERO_BASIC_AUTH_TOKEN}`,
        },
        timeout: 30000,
      }
    );

    const payheroData = response.data;

    console.log("PayHero payment response:", payheroData);

    return res.json({
      success: payheroData.success === true,
      status: payheroData.status,
      message: payheroData.success
        ? "STK push sent. Please check your phone."
        : "Payment request failed",
      reference: payheroData.reference,
      checkout_id: payheroData.CheckoutRequestID,
      external_reference: payheroData.external_reference,
    });
  } catch (error) {
    console.error("PayHero payment error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "STK Push failed",
      error: error.response?.data || error.message,
    });
  }
});

/* ------------------ PAYHERO WEBHOOK ------------------ */
app.post("/payhero-webhook", async (req, res) => {
  console.log("PayHero webhook received:", req.body);

  const payment = req.body;

  if (payment.success === true && payment.status === "success") {
    console.log("Payment completed:", payment.external_reference);
  }

  return res.status(200).json({
    received: true,
  });
});

/* ------------------ START SERVER ------------------ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});