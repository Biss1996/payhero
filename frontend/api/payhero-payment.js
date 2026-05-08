const payments = global.payments || (global.payments = {});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      phone,
      amount,
      reference,
      customer_name,
    } = req.body || {};

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone and amount are required",
      });
    }

    // format phone number
    let formattedPhone = String(phone).trim();

    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (formattedPhone.startsWith("254")) {
      formattedPhone = "0" + formattedPhone.slice(3);
    }

    const externalReference =
      reference || `LOAN-${Date.now()}`;

    // save pending payment
    payments[externalReference] = {
      status: "pending",
      amount: Number(amount),
      phone: formattedPhone,
      created_at: new Date(),
    };

    const response = await fetch(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // IMPORTANT
          Authorization: `Bearer ${process.env.PAYHERO_API_KEY}`,
        },

        body: JSON.stringify({
          amount: Number(amount),
          phone_number: formattedPhone,
          channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
          provider: "m-pesa",
          external_reference: externalReference,
          customer_name: customer_name || "Customer",
          callback_url: process.env.PAYHERO_CALLBACK_URL,
        }),
      }
    );

    const data = await response.json();

    console.log("PAYHERO RESPONSE:", data);

    // failed request
    if (!response.ok) {
      payments[externalReference].status = "failed";

      return res.status(response.status).json({
        success: false,
        message: data.message || "STK Push failed",
        data,
      });
    }

    // success
    return res.status(200).json({
      success: true,
      message: "STK Push sent successfully",
      reference: externalReference,
      data,
    });
  } catch (error) {
    console.log("PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "STK Push failed",
      error: error.message,
    });
  }
}