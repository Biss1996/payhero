export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { phone, amount, reference, customer_name } = req.body || {};

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone and amount are required",
      });
    }

    if (!process.env.PAYHERO_BASIC_AUTH_TOKEN || !process.env.PAYHERO_CHANNEL_ID) {
      return res.status(500).json({
        success: false,
        message: "PayHero server environment variables are missing",
      });
    }

    let formattedPhone = String(phone).trim();

    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (formattedPhone.startsWith("254")) {
      formattedPhone = "0" + formattedPhone.slice(3);
    }

    if (!/^0(7|1)\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid M-Pesa phone number",
      });
    }

    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    const cleanReference = String(reference || `LOAN-${Date.now()}`)
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 40);

    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.PAYHERO_BASIC_AUTH_TOKEN,
      },
      body: JSON.stringify({
        amount: amountNumber,
        phone_number: formattedPhone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: cleanReference,
        customer_name: customer_name || "Customer",
        callback_url: process.env.PAYHERO_CALLBACK_URL,
      }),
    });

    const data = await response.json();

    return res.status(response.status).json({
      success: data.success === true,
      status: data.status,
      message:
        data.success === true
          ? "STK push sent. Please check your phone."
          : data.error_message || data.message || "Payment request failed",
      reference: data.reference,
      checkout_id: data.CheckoutRequestID,
      external_reference: cleanReference,
      raw: data,
    });
  } catch (error) {
    console.error("PayHero STK error:", error);

    return res.status(500).json({
      success: false,
      message: "STK Push failed",
      error: error.message,
    });
  }
}