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

    let formattedPhone = String(phone).trim();

    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (formattedPhone.startsWith("254")) {
      formattedPhone = "0" + formattedPhone.slice(3);
    }

    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.PAYHERO_BASIC_AUTH_TOKEN,
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone_number: formattedPhone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: reference || `LOAN-${Date.now()}`,
        customer_name: customer_name || "Customer",
        callback_url: process.env.PAYHERO_CALLBACK_URL,
      }),
    });

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "STK Push failed",
      error: error.message,
    });
  }
}