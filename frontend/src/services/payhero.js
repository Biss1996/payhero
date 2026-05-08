import API from "../api";

/**
 * Send STK Push request
 */
export const initiateSTKPush = async (
  phone,
  amount,
  reference
) => {
  try {
    const res = await API.post(
      "/api/payhero-payment",
      {
        phone,
        amount,
        reference:
          reference || `LOAN-${Date.now()}`,
      }
    );

    return res.data;
  } catch (error) {
    console.error(
      "STK Error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Payment failed",
    };
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (
  reference
) => {
  try {
    const res = await API.get(
      `/api/payment-status/${reference}`
    );

    return res.data;
  } catch (error) {
    console.error(
      "Status Error:",
      error.response?.data || error.message
    );

    return {
      success: false,
      status: "failed",
    };
  }
};