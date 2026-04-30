import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Initiate PayHero STK Push
export const initiateSTKPush = async (phone, amount, reference) => {
  try {
    const res = await API.post("/payhero", {
      phone,
      amount,
      reference: reference || `PAY-${Date.now()}`,
    });

    return res.data;
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);

    return {
      success: false,
      message: error.response?.data?.message || "Payment failed",
    };
  }
};

export default API;