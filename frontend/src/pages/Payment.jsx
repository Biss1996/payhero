import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Loader from "../components/Loader";

import {
  initiateSTKPush,
  checkPaymentStatus,
} from "../services/payhero";

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loanData, setLoanData] = useState(null);

  const navigate = useNavigate();
  const pollingRef = useRef(false);

  useEffect(() => {
    try {
      const data = JSON.parse(
        sessionStorage.getItem("myLoan") || "null"
      );

      if (!data) {
        navigate("/apply", { replace: true });
        return;
      }

      setFormData(data);
      setLoanData(data);
    } catch (err) {
      console.log("Storage error:", err);
      navigate("/apply", { replace: true });
    }
  }, [navigate]);

  const verifyPayment = async (reference) => {
    Swal.fire({
      title: "Confirming Payment...",
      html: `
        <div style="text-align:center">
          <p>We are verifying your M-Pesa payment.</p>
          <small>Please wait...</small>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const maxAttempts = 12; // ~36 seconds total
    const delay = 3000;

    pollingRef.current = true;

    for (let i = 0; i < maxAttempts; i++) {
      if (!pollingRef.current) return;

      try {
        const res = await checkPaymentStatus(reference);

        console.log("PAYMENT STATUS:", res);

        const status = res?.status?.toLowerCase();

        // ✅ SUCCESS
        if (
          status === "completed" ||
          status === "success" ||
          status === "paid"
        ) {
          pollingRef.current = false;

          sessionStorage.setItem(
            "payment_status",
            "completed"
          );

          Swal.fire({
            title: "Payment Successful 🎉",
            text: "Your payment has been confirmed.",
            icon: "success",
            confirmButtonColor: "#10b981",
          }).then(() => {
            navigate("/success", { replace: true });
          });

          return;
        }

        // ❌ FAILED
        if (
          status === "failed" ||
          status === "cancelled"
        ) {
          pollingRef.current = false;

          Swal.fire({
            title: "Payment Failed",
            text: "Transaction was cancelled or failed.",
            icon: "error",
            confirmButtonColor: "#ef4444",
          });

          setLoading(false);
          return;
        }
      } catch (err) {
        console.log("Polling error:", err);
      }

      await new Promise((r) =>
        setTimeout(r, delay)
      );
    }

    pollingRef.current = false;

    setLoading(false);

    Swal.fire({
      title: "Still Pending",
      text: "We could not confirm payment yet. Please try again shortly.",
      icon: "warning",
      confirmButtonColor: "#f59e0b",
    });
  };

  const handlePay = async () => {
    if (loading) return;

    if (!formData || !loanData) {
      toast.error("Missing data");
      return;
    }

    if (
      !formData.phone_number ||
      !loanData.processing_fee
    ) {
      toast.error("Missing phone or amount");
      return;
    }

    setLoading(true);

    Swal.fire({
      title: "Sending STK Push...",
      html: `Please check your phone`,
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const reference = `LOAN-${Date.now()}`;

      const response = await initiateSTKPush(
        formData.phone_number,
        loanData.processing_fee,
        reference
      );

      console.log("STK RESPONSE:", response);

      if (response.success) {
        sessionStorage.setItem(
          "payment_reference",
          reference
        );

        toast.success("STK Push sent");

        // 🚀 AUTO START VERIFICATION (no manual button)
        await verifyPayment(reference);
      } else {
        setLoading(false);

        Swal.fire({
          title: "Failed",
          text:
            response.message ||
            "Could not initiate payment",
          icon: "error",
        });
      }
    } catch (error) {
      console.log("Payment error:", error);

      setLoading(false);

      Swal.fire({
        title: "Error",
        text: "Payment failed. Try again.",
        icon: "error",
      });
    }
  };

  if (!formData || !loanData) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">

        <h1 className="text-2xl font-bold text-center mb-6">
          Loan Activation
        </h1>

        <div className="text-center mb-6">
          <p className="text-gray-500">Pay</p>
          <p className="text-3xl font-bold">
            KES {loanData.processing_fee}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded mb-6 text-center">
          <p className="text-sm text-gray-600">
            Phone
          </p>
          <p className="font-semibold">
            {formData.phone_number}
          </p>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <button
            onClick={handlePay}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
          >
            Pay via M-Pesa
          </button>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          You will receive an STK Push on your phone
        </p>
      </div>
    </div>
  );
}