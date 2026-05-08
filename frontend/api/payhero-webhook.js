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

    // initialize payment if not exists
    if (!payments[reference]) {
      payments[reference] = {
        status: "pending",
        created_at: new Date(),
      };
    }

    const isSuccess =
      data?.success === true ||
      ["success", "completed"].includes(
        data?.status?.toLowerCase()
      );

    if (isSuccess) {
      payments[reference] = {
        ...payments[reference],
        status: "completed",
        paid_at: new Date(),
        transaction_id:
          data?.transaction_id ||
          data?.mpesa_receipt_number ||
          null,
        amount:
          data?.amount ||
          payments[reference].amount,
        phone:
          data?.phone_number ||
          payments[reference].phone,
        raw: data,
      };

      console.log("PAYMENT CONFIRMED:", reference);
    } else {
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