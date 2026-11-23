import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

const stats = [
  {
    title: "Total Sales",
    value: "₦1,245,000",
    change: "+12.5%",
    positive: true,
    icon: CreditCard,
    iconStyle: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Total Orders",
    value: "248",
    change: "+8.2%",
    positive: true,
    icon: ShoppingBag,
    iconStyle: "bg-blue-50 text-blue-600",
  },
  {
    title: "Customers",
    value: "186",
    change: "+5.4%",
    positive: true,
    icon: Users,
    iconStyle: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Products",
    value: "64",
    change: "-2.1%",
    positive: false,
    icon: Package,
    iconStyle: "bg-amber-50 text-amber-600",
  },
];

const recentOrders = [
  {
    id: "#ORD-1024",
    customer: "Amina Yusuf",
    date: "Today, 10:42 AM",
    amount: "₦45,000",
    status: "Paid",
  },
  {
    id: "#ORD-1023",
    customer: "David Okafor",
    date: "Today, 9:18 AM",
    amount: "₦28,500",
    status: "Processing",
  },
  {
    id: "#ORD-1022",
    customer: "Fatima Bello",
    date: "Yesterday, 4:35 PM",
    amount: "₦72,000",
    status: "Delivered",
  },
  {
    id: "#ORD-1021",
    customer: "Samuel Ade",
    date: "Yesterday, 2:10 PM",
    amount: "₦15,000",
    status: "Pending",
  },
];

const salesActivity = [
  { day: "Mon", height: "45%" },
  { day: "Tue", height: "65%" },
  { day: "Wed", height: "52%" },
  { day: "Thu", height: "85%" },
  { day: "Fri", height: "60%" },
  { day: "Sat", height: "95%" },
  { day: "Sun", height: "72%" },
];

function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Sample data
          </span>

          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-500"
            defaultValue="7"
            aria-label="Sales period"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.iconStyle}`}>
                  <Icon size={21} />
                </div>

                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.positive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <ArrowDownRight size={15} />
                  )}
                  {stat.change}
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {stat.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Sales activity and order summary */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sales Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your sales performance over the last 7 days
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-900">
              ₦425,000
            </span>
          </div>

          <div className="mt-8 flex h-56 items-end justify-between gap-3">
            {salesActivity.map((item) => (
              <div
                key={item.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              >
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-indigo-500 transition-colors hover:bg-indigo-700"
                    style={{ height: item.height }}
                    title={`${item.day} sales`}
                  />
                </div>

                <span className="text-xs text-slate-400">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">
            Order Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current order overview
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pending</span>
                <span className="font-semibold text-slate-900">18</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/4 rounded-full bg-amber-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Processing</span>
                <span className="font-semibold text-slate-900">12</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/5 rounded-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivered</span>
                <span className="font-semibold text-slate-900">210</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-5/6 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Orders
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A quick look at your latest customer orders
            </p>
          </div>

          <button
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            type="button"
          >
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-sm hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-indigo-600">
                    {order.id}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.customer}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {order.date}
                  </td>

                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {order.amount}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.status === "Delivered"
                            ? "bg-blue-50 text-blue-700"
                            : order.status === "Processing"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DashboardOverview;