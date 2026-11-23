
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  Wallet,
} from "lucide-react";

interface EarningsTransaction {
  id: string;
  date: string;
  customer: string;
  deliveryFee: number;
  commission: number;
  netEarnings: number;
  status: "Paid" | "Pending";
}

const initialTransactions: EarningsTransaction[] = [
  {
    id: "DEL-1005",
    date: "Nov 23, 2026",
    customer: "Samuel Peter",
    deliveryFee: 3500,
    commission: 350,
    netEarnings: 3150,
    status: "Paid",
  },
  {
    id: "DEL-1004",
    date: "Nov 23, 2026",
    customer: "Mary Adams",
    deliveryFee: 2500,
    commission: 250,
    netEarnings: 2250,
    status: "Paid",
  },
  {
    id: "DEL-1003",
    date: "Nov 22, 2026",
    customer: "David James",
    deliveryFee: 3000,
    commission: 300,
    netEarnings: 2700,
    status: "Paid",
  },
  {
    id: "DEL-1002",
    date: "Nov 21, 2026",
    customer: "Michael Johnson",
    deliveryFee: 2500,
    commission: 250,
    netEarnings: 2250,
    status: "Pending",
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export default function RiderEarningsPage() {
  const [transactions] = useState(initialTransactions);
  const [period, setPeriod] = useState("All");

  const totalGross = transactions.reduce(
    (total, transaction) => total + transaction.deliveryFee,
    0
  );

  const totalCommission = transactions.reduce(
    (total, transaction) => total + transaction.commission,
    0
  );

  const totalNet = transactions.reduce(
    (total, transaction) => total + transaction.netEarnings,
    0
  );

  const filteredTransactions =
    period === "All"
      ? transactions
      : transactions.filter((transaction) =>
          period === "Today"
            ? transaction.date === "Nov 23, 2026"
            : period === "This week"
              ? ["Nov 23, 2026", "Nov 22, 2026", "Nov 21, 2026"].includes(
                  transaction.date
                )
              : true
        );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your delivery income and commission deductions.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Wallet size={18} />
          Total net earnings
        </div>

        <h2 className="mt-3 text-3xl font-bold">
          {formatCurrency(totalNet)}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Based on the completed demo transactions displayed below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Gross delivery fees</p>
            <ArrowUpRight className="text-emerald-600" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalGross)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Before commission deductions
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Commission deductions</p>
            <ArrowDownRight className="text-red-500" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalCommission)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Demo commission rate: 10%
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Net earnings</p>
            <CheckCircle className="text-emerald-600" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalNet)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            After commission deductions
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Earnings transactions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Delivery payments and their deductions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-400" />
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="All">All transactions</option>
              <option value="Today">Today</option>
              <option value="This week">This week</option>
              <option value="This month">This month</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Delivery</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Gross fee</th>
                <th className="px-5 py-4 font-medium">Commission</th>
                <th className="px-5 py-4 font-medium">Net earnings</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {transaction.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {transaction.customer}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {transaction.date}
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {formatCurrency(transaction.deliveryFee)}
                  </td>

                  <td className="px-5 py-4 text-red-600">
                    -{formatCurrency(transaction.commission)}
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {formatCurrency(transaction.netEarnings)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        transaction.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Demo earnings information
        </p>
        <p className="mt-1 text-sm text-amber-800">
          These figures and transactions are sample frontend data. Actual
          earnings, commissions, and settlements will be connected to the
          backend later.
        </p>
      </div>
    </div>
  );
}
