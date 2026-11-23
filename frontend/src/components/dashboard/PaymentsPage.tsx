
import { useMemo, useState } from "react";
import {
  Search,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

type Payment = {
  id: string;
  customerId: string;
  customerName: string;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
};

const initialPayments: Payment[] = [
  {
    id: "pay_001",
    customerId: "cus_001",
    customerName: "Amina Yusuf",
    reference: "PAY-7f3a91",
    amount: 45000,
    currency: "NGN",
    status: "SUCCESSFUL",
    description: "Order payment",
    createdAt: "2026-11-20T08:15:00",
    updatedAt: "2026-11-20T08:17:00",
  },
  {
    id: "pay_002",
    customerId: "cus_002",
    customerName: "Ibrahim Musa",
    reference: "PAY-2b8c42",
    amount: 28500,
    currency: "NGN",
    status: "PENDING",
    description: "Order payment",
    createdAt: "2026-11-20T09:10:00",
    updatedAt: "2026-11-20T09:10:00",
  },
  {
    id: "pay_003",
    customerId: "cus_003",
    customerName: "Fatima Bello",
    reference: "PAY-9d1e65",
    amount: 72000,
    currency: "NGN",
    status: "SUCCESSFUL",
    description: "Bulk product order",
    createdAt: "2026-11-19T14:30:00",
    updatedAt: "2026-11-19T14:32:00",
  },
  {
    id: "pay_004",
    customerId: "cus_004",
    customerName: "Tunde Adewale",
    reference: "PAY-4c6f20",
    amount: 19500,
    currency: "NGN",
    status: "FAILED",
    description: "Order payment",
    createdAt: "2026-11-19T11:45:00",
    updatedAt: "2026-11-19T11:46:00",
  },
  {
    id: "pay_005",
    customerId: "cus_005",
    customerName: "Grace Okafor",
    reference: "PAY-8a2d73",
    amount: 56000,
    currency: "NGN",
    status: "PENDING",
    description: "Product purchase",
    createdAt: "2026-11-18T16:20:00",
    updatedAt: "2026-11-18T16:20:00",
  },
  {
    id: "pay_006",
    customerId: "cus_006",
    customerName: "David Eze",
    reference: "PAY-5e9b14",
    amount: 32000,
    currency: "NGN",
    status: "SUCCESSFUL",
    description: "Order payment",
    createdAt: "2026-11-18T10:05:00",
    updatedAt: "2026-11-18T10:07:00",
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (payment) => payment.status === "SUCCESSFUL",
    );

    const pending = payments.filter(
      (payment) => payment.status === "PENDING",
    );

    const failed = payments.filter(
      (payment) => payment.status === "FAILED",
    );

    return {
      total: payments.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      revenue: successful.reduce(
        (total, payment) => total + payment.amount,
        0,
      ),
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return payments.filter((payment) => {
      const matchesSearch =
        payment.reference.toLowerCase().includes(search) ||
        payment.customerName.toLowerCase().includes(search) ||
        payment.customerId.toLowerCase().includes(search) ||
        payment.description.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const simulateVerification = (paymentId: string) => {
    setPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.id === paymentId && payment.status === "PENDING"
          ? {
              ...payment,
              status: "SUCCESSFUL",
              updatedAt: new Date().toISOString(),
            }
          : payment,
      ),
    );

    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Payments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor customer payments and transaction activity.
        </p>
      </div>

      {/* Revenue Summary */}
      <div className="rounded-2xl bg-slate-900 p-6 text-white">
        <p className="text-sm text-slate-300">
          Successful Payment Revenue
        </p>
        <h2 className="mt-2 text-3xl font-bold">
          {formatCurrency(stats.revenue)}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Revenue from successful payments only
        </p>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Payments
            </p>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Successful Payments
            </p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.successful}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Pending Payments
            </p>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Failed Payments
            </p>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.failed}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Payment Transactions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter your payment records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search payments..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reference
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {payment.reference}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {payment.customerName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.customerId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {payment.description}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          payment.status === "SUCCESSFUL"
                            ? "bg-green-50 text-green-700"
                            : payment.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(payment.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(payment)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No payments found. Try changing your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Payment Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Transaction information
                </p>
              </div>

              <button
                type="button"
                aria-label="Close payment details"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Payment Status
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedPayment.status === "SUCCESSFUL"
                      ? "bg-green-50 text-green-700"
                      : selectedPayment.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {selectedPayment.status}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Payment Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Payment ID</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {selectedPayment.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment Reference
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedPayment.reference}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedPayment.customerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedPayment.customerId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedPayment.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Currency</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedPayment.currency}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(selectedPayment.updatedAt)}
                  </p>
                </div>
              </div>

              {selectedPayment.status === "PENDING" && (
                <div className="border-t border-slate-200 pt-5">
                  <p className="mb-3 text-xs text-amber-700">
                    Demo only: this action simulates a successful
                    verification. It does not contact Paystack or
                    update the backend.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      simulateVerification(selectedPayment.id)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Simulate Verification
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
