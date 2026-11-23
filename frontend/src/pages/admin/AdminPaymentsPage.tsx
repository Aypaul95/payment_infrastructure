
import { useState } from "react";
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  X,
} from "lucide-react";

type PaymentStatus = "Successful" | "Pending" | "Failed" | "Refunded";

interface Payment {
  id: string;
  orderId: string;
  customer: string;
  email: string;
  business: string;
  amount: number;
  method: string;
  reference: string;
  status: PaymentStatus;
  date: string;
}

const initialPayments: Payment[] = [
  {
    id: "PAY-1001",
    orderId: "ORD-1001",
    customer: "Michael Johnson",
    email: "michael@example.com",
    business: "Mama's Kitchen",
    amount: 18500,
    method: "Paystack",
    reference: "PSK-982341001",
    status: "Successful",
    date: "2026-11-23",
  },
  {
    id: "PAY-1002",
    orderId: "ORD-1002",
    customer: "Grace Williams",
    email: "grace@example.com",
    business: "Fresh Basket",
    amount: 32000,
    method: "Paystack",
    reference: "PSK-982341002",
    status: "Successful",
    date: "2026-11-23",
  },
  {
    id: "PAY-1003",
    orderId: "ORD-1003",
    customer: "David James",
    email: "david@example.com",
    business: "HealthPlus Store",
    amount: 12500,
    method: "Paystack",
    reference: "PSK-982341003",
    status: "Pending",
    date: "2026-11-22",
  },
  {
    id: "PAY-1004",
    orderId: "ORD-1004",
    customer: "Mary Adams",
    email: "mary@example.com",
    business: "Mama Foods",
    amount: 45000,
    method: "Paystack",
    reference: "PSK-982341004",
    status: "Failed",
    date: "2026-11-22",
  },
  {
    id: "PAY-1005",
    orderId: "ORD-1005",
    customer: "Samuel Peter",
    email: "samuel@example.com",
    business: "City Pharmacy",
    amount: 7800,
    method: "Paystack",
    reference: "PSK-982341005",
    status: "Refunded",
    date: "2026-11-21",
  },
  {
    id: "PAY-1006",
    orderId: "ORD-1006",
    customer: "Aisha Ibrahim",
    email: "aisha@example.com",
    business: "Daily Needs Market",
    amount: 21500,
    method: "Paystack",
    reference: "PSK-982341006",
    status: "Successful",
    date: "2026-11-21",
  },
];

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

const statusStyles: Record<PaymentStatus, string> = {
  Successful: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Failed: "bg-red-100 text-red-700",
  Refunded: "bg-gray-100 text-gray-700",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const successfulPayments = payments.filter(
    (payment) => payment.status === "Successful"
  );

  const totalRevenue = successfulPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const pendingCount = payments.filter(
    (payment) => payment.status === "Pending"
  ).length;

  const failedCount = payments.filter(
    (payment) => payment.status === "Failed"
  ).length;

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = [
      payment.id,
      payment.orderId,
      payment.customer,
      payment.email,
      payment.business,
      payment.reference,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || payment.status === filter;

    return matchesSearch && matchesFilter;
  });

  const updateStatus = (id: string, status: PaymentStatus) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.id === id ? { ...payment, status } : payment
      )
    );

    if (selectedPayment?.id === id) {
      setSelectedPayment((current) =>
        current ? { ...current, status } : null
      );
    }
  };

  const statusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "Successful":
        return <CheckCircle size={14} />;
      case "Pending":
        return <Clock size={14} />;
      case "Failed":
        return <XCircle size={14} />;
      case "Refunded":
        return <RotateCcw size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Payments Management
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor and manage platform payment transactions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <CreditCard className="text-blue-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold mt-3">{payments.length}</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Successful Revenue</p>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold mt-3">
            {formatCurrency(totalRevenue)}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending Payments</p>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold mt-3">{pendingCount}</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Failed Payments</p>
            <XCircle className="text-red-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold mt-3">{failedCount}</h2>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search payment, order, customer, business or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Payment ID",
                  "Order ID",
                  "Customer",
                  "Business",
                  "Amount",
                  "Method",
                  "Status",
                  "Date",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                    {payment.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {payment.orderId}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {payment.customer}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {payment.business}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {payment.method}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[payment.status]}`}
                    >
                      {statusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {payment.date}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View payment"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No payments found.
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Payment Details</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center py-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Payment Amount</p>
                <h3 className="text-3xl font-bold mt-1">
                  {formatCurrency(selectedPayment.amount)}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-medium ${statusStyles[selectedPayment.status]}`}
                >
                  {statusIcon(selectedPayment.status)}
                  {selectedPayment.status}
                </span>
              </div>

              <div className="space-y-3">
                {[
                  ["Payment ID", selectedPayment.id],
                  ["Order ID", selectedPayment.orderId],
                  ["Customer", selectedPayment.customer],
                  ["Customer Email", selectedPayment.email],
                  ["Business", selectedPayment.business],
                  ["Payment Method", selectedPayment.method],
                  ["Reference", selectedPayment.reference],
                  ["Date", selectedPayment.date],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 text-sm border-b border-gray-100 pb-2"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900 text-right break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Demo status controls */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3">
                  Update Payment Status (Demo)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "Successful",
                      "Pending",
                      "Failed",
                      "Refunded",
                    ] as PaymentStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedPayment.id, status)}
                      disabled={selectedPayment.status === status}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                        selectedPayment.status === status
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          This page uses demo data. Payment status changes are local only and do
          not affect actual Paystack transactions.
        </p>
      </div>
    </div>
  );
}
