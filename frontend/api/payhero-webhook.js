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

    // ensure payment exists
    if (!payments[reference]) {
      payments[reference] = {
        status: "pending",
        created_at: new Date(),
      };
    }

    // ✅ ONLY mark success when confirmed
    const isSuccess =
      data?.success === true ||
      data?.status === "success" ||
      data?.status === "completed";

    if (isSuccess) {
      payments[reference] = {
        ...payments[reference],
        status: "completed",
        paid_at: new Date(),
        transaction_id:
          data?.transaction_id ||
          data?.mpesa_receipt_number ||
          null,
        amount: data?.amount || payments[reference].amount,
        phone: data?.phone_number || payments[reference].phone,
        raw: data,
      };

      console.log("PAYMENT CONFIRMED:", reference);
    } else {
      // ⚠️ DO NOT mark failed immediately
      payments[reference] = {
        ...payments[reference],
        status: "pending",
        last_update: new Date(),
        raw: data,
      };

      console.log("PAYMENT STILL PENDING:", reference);
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