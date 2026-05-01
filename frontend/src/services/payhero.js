import API from "../api";

export const initiateSTKPush = async (phone, amount, reference) => {
  try {
    const res = await API.post("/api/payhero-payment", {
      phone,
      amount,
      reference: reference || `LOAN-${Date.now()}`,
    });

    return res.data;
  } catch (error) {
    console.error("PayHero Error:", error.response?.data || error.message);

    return {
      success: false,
      message: error.response?.data?.message || "Payment failed",
    };
  }
};