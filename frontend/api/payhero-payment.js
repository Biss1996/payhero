import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      phone,
      amount,
      reference,
      customer_name,
    } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const response = await axios.post(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        amount: Number(amount),
        phone_number: phone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference:
          reference || `LOAN-${Date.now()}`,
        customer_name: customer_name || "Customer",
        callback_url:
          process.env.PAYHERO_CALLBACK_URL,
      },
      {
        headers: {
          "Content-Type": "application/json",

          // ⚠️ CHANGE THIS IF PAYHERO USES BASIC AUTH
          Authorization: process.env.PAYHERO_API_KEY,
        },
        timeout: 15000,
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.log(
      "PAYHERO ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Payment failed",
      error: error.message,
    });
  }
}