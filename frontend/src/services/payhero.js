import api from "../api";

// ✅ Initiate payment
export const initiatePayment = async (phone, amount, reference) => {
  try {
    const res = await api.post("/stkpush", {
      phone,
      amount,
      reference,
    });

    return res.data;
  } catch (error) {
    console.error("Payment Error:", error);

    return {
      success: false,
      message: "Payment failed",
    };
  }
};