import API from "../api";

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
        reference,
      }
    );

    return res.data;
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        "Payment failed",
    };
  }
};