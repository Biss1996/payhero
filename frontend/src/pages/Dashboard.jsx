import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    name: "",
    loan: {},
  });

  useEffect(() => {
    const paymentStatus = sessionStorage.getItem("payment_status");
    const loanData = JSON.parse(sessionStorage.getItem("myLoan") || "{}");
    const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");

    if (paymentStatus !== "completed") {
      navigate("/apply");
      return;
    }

    setData({
      name: userData.name || "User",
      loan: loanData,
    });

    setLoading(false);
  }, [navigate]);

  const generateRef = () => {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  };

  const formatDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toDateString();
  };

  const logout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  const amount = parseInt(data.loan.loan_amount || 0);
  const fee = data.loan.processing_fee || 0;
  const repayment = amount * 1.1;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-black text-white p-4 text-center font-bold">
        Tala HashPay Loans
      </div>

      {/* Nav */}
      <div className="flex justify-end p-4">
        <button
          onClick={logout}
          className="border px-4 py-2 rounded text-blue-600 border-blue-600"
        >
          Logout
        </button>
      </div>

      <div className="max-w-xl mx-auto p-4">

        {/* Welcome */}
        <h1 className="text-2xl font-bold mb-4">
          Hi {data.name}
        </h1>

        {/* Card */}
        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-green-600 font-bold mb-4">
            Approved
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-gray-500">Loan Amount</p>
              <p className="font-bold text-green-600">
                Ksh {amount.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Processing Fee</p>
              <p className="font-bold">Ksh {fee}</p>
            </div>

            <div>
              <p className="text-gray-500">Repayment</p>
              <p className="font-bold">
                Ksh {repayment.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-bold">{formatDate(60)}</p>
            </div>

            <div>
              <p className="text-gray-500">Reference</p>
              <p className="font-bold">
                Tala Hashpay ID-{generateRef()}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}