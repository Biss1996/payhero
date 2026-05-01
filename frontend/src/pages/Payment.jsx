import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { initiateSTKPush } from "../services/payhero";

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loanData, setLoanData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem("myLoan") || "null");

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

  const handlePay = async () => {
    if (loading) return;

    if (!loanData || !formData) {
      toast.error("Missing loan or user data");
      return;
    }

    if (!formData.phone_number || !loanData.processing_fee) {
      toast.error("Missing phone number or activation fee");
      return;
    }

    setLoading(true);

    Swal.fire({
      title: "Sending STK Push",
      html: `
        Sending M-Pesa payment request...<br/>
        <b>Please wait</b>
      `,
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

      console.log("PAYHERO RESPONSE:", response);

      if (response.success) {
        sessionStorage.setItem("payment_status", "pending");
        sessionStorage.setItem("payment_reference", response.reference || "");
        sessionStorage.setItem("external_reference", reference);

        toast.success("STK Push sent!");

        Swal.fire({
          title: "Check Your Phone 📱",
          html: `
            <div style="text-align:center">
              <p>An M-Pesa STK Push has been sent to:</p>
              <strong>${formData.phone_number}</strong>
              <br/><br/>
              <p>Please enter your M-Pesa PIN to complete payment.</p>
              <br/>
              <small style="color:#6b7280">
                Do not refresh or close this page until you finish.
              </small>
            </div>
          `,
          icon: "info",
          confirmButtonColor: "#10b981",
          confirmButtonText: "I Have Completed Payment",
          allowOutsideClick: false,
        }).then(() => {
          navigate("/success", { replace: true });
        });
      } else {
        setLoading(false);

        Swal.fire({
          title: "Payment Failed",
          text: response.message || "STK Push could not be initiated.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.log("Payment error:", error);
      setLoading(false);

      Swal.fire({
        title: "Error",
        text: "STK Push failed. Please try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });

      toast.error("Payment error");
    }
  };

  if (!formData || !loanData) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-emerald-500 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Loan Activation</h1>
          <p className="text-sm opacity-90 mt-1">Secure M-Pesa Checkout</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gradient-to-r from-emerald-500 to-sky-500 rounded-xl p-6 text-center text-white shadow-lg">
            <p className="text-sm opacity-90">
              Congratulations! You are approved for
            </p>

            <p className="text-5xl font-extrabold mt-2">
              KES {loanData.loan_amount?.toLocaleString() || 0}
            </p>

            <p className="mt-3 text-xs bg-white/20 inline-block px-3 py-1 rounded-full">
              ✔ Pre-approved • Fast processing
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border text-center">
            <p className="text-sm text-gray-500">Activation Fee</p>

            <p className="text-3xl font-bold text-gray-900 mt-1">
              KES {loanData.processing_fee?.toLocaleString() || 0}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              One-time fee required to continue processing
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-gray-600">M-Pesa Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {formData.phone_number}
            </p>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            You will receive an M-Pesa STK Push. Enter your M-Pesa PIN on your
            phone to complete the payment.
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader />
              <p className="text-sm text-gray-500 mt-2">
                Waiting for payment action...
              </p>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg shadow-md hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Activate via M-Pesa
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            Secure M-Pesa STK Push Payment
          </p>
        </div>
      </div>
    </div>
  );
}