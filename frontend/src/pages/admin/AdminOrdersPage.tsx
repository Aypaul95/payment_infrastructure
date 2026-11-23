
import { useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Eye,
  X,
  Calendar,
  User,
  Store,
  MapPin,
} from "lucide-react";

type OrderStatus =
  | "Pending"
  | "Paid"
  | "Processing"
  | "Completed"
  | "Cancelled";

type Order = {
  id: string;
  customer: string;
  email: string;
  business: string;
  items: number;
  total: number;
  payment: string;
  status: OrderStatus;
  date: string;
  address: string;
};

const initialOrders: Order[] = [
  {
    id: "ORD-1001",
    customer: "Michael Johnson",
    email: "michael@example.com",
    business: "Mama's Kitchen",
    items: 3,
    total: 18500,
    payment: "Paid",
    status: "Processing",
    date: "Nov 23, 2026",
    address: "GRA, Ilorin, Kwara",
  },
  {
    id: "ORD-1002",
    customer: "Grace Williams",
    email: "grace@example.com",
    business: "Fresh Basket",
    items: 5,
    total: 32000,
    payment: "Paid",
    status: "Completed",
    date: "Nov 22, 2026",
    address: "Tanke, Ilorin, Kwara",
  },
  {
    id: "ORD-1003",
    customer: "David James",
    email: "david@example.com",
    business: "HealthPlus Store",
    items: 2,
    total: 12500,
    payment: "Pending",
    status: "Pending",
    date: "Nov 22, 2026",
    address: "Fate, Ilorin, Kwara",
  },
  {
    id: "ORD-1004",
    customer: "Mary Adams",
    email: "mary@example.com",
    business: "Mama Foods",
    items: 4,
    total: 24000,
    payment: "Paid",
    status: "Paid",
    date: "Nov 21, 2026",
    address: "Sango, Ilorin, Kwara",
  },
  {
    id: "ORD-1005",
    customer: "Samuel Peter",
    email: "samuel@example.com",
    business: "City Pharmacy",
    items: 1,
    total: 8500,
    payment: "Paid",
    status: "Cancelled",
    date: "Nov 20, 2026",
    address: "Unity Road, Ilorin, Kwara",
  },
  {
    id: "ORD-1006",
    customer: "Aisha Ibrahim",
    email: "aisha@example.com",
    business: "Daily Needs Market",
    items: 6,
    total: 41500,
    payment: "Paid",
    status: "Processing",
    date: "Nov 20, 2026",
    address: "Taiwo Road, Ilorin, Kwara",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const stats = {
    total: orders.length,
    pending: orders.filter((order) => order.status === "Pending").length,
    processing: orders.filter((order) => order.status === "Processing").length,
    completed: orders.filter((order) => order.status === "Completed").length,
  };

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.business.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );

    setSelectedOrder((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const statusStyle = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Paid":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-purple-100 text-purple-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
    }
  };

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString("en-NG")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Orders Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage orders across all businesses on the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Orders</p>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Processing</p>
            <ShoppingBag className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.processing}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Completed Orders</p>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">All Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search and review platform orders.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{order.date}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{order.customer}</p>
                    <p className="mt-1 text-xs text-gray-500">{order.items} items</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{order.business}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
                      title="View order"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="font-semibold text-gray-900">Order Details</h2>
                <p className="mt-1 text-xs text-gray-500">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedOrder.customer}</p>
                    <p>{selectedOrder.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.business}</span>
                </div>

                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.items} items</span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.date}</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.address}</span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedOrder.payment}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Update Order Status
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(event) =>
                    updateStatus(selectedOrder.id, event.target.value as OrderStatus)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Demo data</p>
        <p className="mt-1">
          Orders and status changes are stored only in frontend state.
          No real customer orders or payments are modified.
        </p>
      </div>
    </div>
  );
}
