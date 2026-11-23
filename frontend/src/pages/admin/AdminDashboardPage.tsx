
import {
  Store,
  Users,
  Bike,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Businesses',
    value: '248',
    change: '+12.5%',
    positive: true,
    description: 'Compared to last month',
    icon: Store,
  },
  {
    title: 'Registered Customers',
    value: '8,642',
    change: '+18.2%',
    positive: true,
    description: 'Compared to last month',
    icon: Users,
  },
  {
    title: 'Active Riders',
    value: '186',
    change: '+8.4%',
    positive: true,
    description: 'Compared to last month',
    icon: Bike,
  },
  {
    title: 'Total Orders',
    value: '12,486',
    change: '+24.6%',
    positive: true,
    description: 'Compared to last month',
    icon: ShoppingBag,
  },
];

const activity = [
  {
    id: 'ORD-1048',
    customer: 'Michael Johnson',
    business: "Mama's Kitchen",
    amount: '₦18,500',
    status: 'Delivered',
  },
  {
    id: 'ORD-1047',
    customer: 'Grace Williams',
    business: 'Fresh Basket',
    amount: '₦32,000',
    status: 'Processing',
  },
  {
    id: 'ORD-1046',
    customer: 'David James',
    business: 'HealthPlus Store',
    amount: '₦12,800',
    status: 'Out for delivery',
  },
  {
    id: 'ORD-1045',
    customer: 'Mary Adams',
    business: 'Mama Foods',
    amount: '₦9,500',
    status: 'Pending',
  },
  {
    id: 'ORD-1044',
    customer: 'Samuel Peter',
    business: 'Fresh Basket',
    amount: '₦24,600',
    status: 'Delivered',
  },
];

const statusStyles: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700',
  Processing: 'bg-blue-100 text-blue-700',
  'Out for delivery': 'bg-purple-100 text-purple-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const quickStats = [
  {
    title: 'Completed Deliveries',
    value: '1,284',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50',
  },
  {
    title: 'Pending Deliveries',
    value: '86',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    title: 'Payments Processed',
    value: '₦24.8M',
    icon: CreditCard,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Active Deliveries',
    value: '42',
    icon: Truck,
    color: 'text-purple-600 bg-purple-50',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your platform's performance and activity.
          </p>
        </div>

        <span className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Demo data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon size={21} />
                </div>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.positive ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {stat.change}
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">{stat.title}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {stat.value}
              </h2>
              <p className="mt-2 text-xs text-slate-400">{stat.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.title}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {item.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-bold text-slate-900">Recent Orders</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest platform transactions
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Last 5 orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order ID</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {order.id}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.customer}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.business}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {order.amount}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Platform Activity</h2>
              <p className="mt-1 text-xs text-slate-500">
                Today's activity summary
              </p>
            </div>
            <ArrowUpRight size={19} className="text-slate-400" />
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Orders completed</span>
                <span className="font-semibold text-slate-900">84%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[84%] rounded-full bg-green-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Deliveries completed</span>
                <span className="font-semibold text-slate-900">72%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[72%] rounded-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Payment success</span>
                <span className="font-semibold text-slate-900">96%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[96%] rounded-full bg-purple-500" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Platform status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-slate-800">
                Demo environment active
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
