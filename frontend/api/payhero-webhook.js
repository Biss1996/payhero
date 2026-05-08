const payments = global.payments || (global.payments = {});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const data = req.body;

    console.log("PAYHERO CALLBACK:", data);

    const reference = data?.external_reference;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Missing external reference",
      });
    }

    // payment successful
    if (
      data?.success === true &&
      (
        data?.status === "success" ||
        data?.status === "completed"
      )
    ) {
      payments[reference] = {
        ...(payments[reference] || {}),
        status: "completed",
        paid_at: new Date(),

        transaction_id:
          data?.transaction_id ||
          data?.mpesa_receipt_number ||
          null,

        amount: data?.amount || null,
        phone: data?.phone_number || null,
        raw: data,
      };

      console.log("PAYMENT CONFIRMED:", reference);
    } else {
      // failed / cancelled payment
      payments[reference] = {
        ...(payments[reference] || {}),
        status: "failed",
        failed_at: new Date(),
        raw: data,
      };

      console.log("PAYMENT FAILED:", reference);
    }

    return res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      received: false,
      error: error.message,
    });
  }
}