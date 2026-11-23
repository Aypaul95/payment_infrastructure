
import { useMemo, useState } from "react";
import {
  Search,
  Truck,
  Clock,
  CheckCircle,
  Package,
  Eye,
  X,
  MapPin,
  User,
  Store,
  Calendar,
  Phone,
} from "lucide-react";

type DeliveryStatus =
  | "Pending"
  | "Assigned"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

type Delivery = {
  id: string;
  orderId: string;
  customer: string;
  customerPhone: string;
  rider: string;
  riderPhone: string;
  business: string;
  pickup: string;
  destination: string;
  fee: number;
  status: DeliveryStatus;
  date: string;
};

const initialDeliveries: Delivery[] = [
  {
    id: "DEL-1001",
    orderId: "ORD-1001",
    customer: "Michael Johnson",
    customerPhone: "+234 801 234 5678",
    rider: "James Okafor",
    riderPhone: "+234 802 111 2233",
    business: "Mama's Kitchen",
    pickup: "GRA, Ilorin, Kwara",
    destination: "Tanke, Ilorin, Kwara",
    fee: 1500,
    status: "In Transit",
    date: "Nov 23, 2026",
  },
  {
    id: "DEL-1002",
    orderId: "ORD-1002",
    customer: "Grace Williams",
    customerPhone: "+234 803 222 3344",
    rider: "Aisha Bello",
    riderPhone: "+234 804 333 4455",
    business: "Fresh Basket",
    pickup: "Fate, Ilorin, Kwara",
    destination: "Unity Road, Ilorin, Kwara",
    fee: 2000,
    status: "Delivered",
    date: "Nov 22, 2026",
  },
  {
    id: "DEL-1003",
    orderId: "ORD-1003",
    customer: "David James",
    customerPhone: "+234 805 444 5566",
    rider: "Not assigned",
    riderPhone: "N/A",
    business: "HealthPlus Store",
    pickup: "Tanke, Ilorin, Kwara",
    destination: "Sango, Ilorin, Kwara",
    fee: 1500,
    status: "Pending",
    date: "Nov 23, 2026",
  },
  {
    id: "DEL-1004",
    orderId: "ORD-1004",
    customer: "Mary Adams",
    customerPhone: "+234 806 555 6677",
    rider: "Ibrahim Musa",
    riderPhone: "+234 807 666 7788",
    business: "Mama Foods",
    pickup: "Taiwo Road, Ilorin, Kwara",
    destination: "GRA, Ilorin, Kwara",
    fee: 1800,
    status: "Assigned",
    date: "Nov 21, 2026",
  },
  {
    id: "DEL-1005",
    orderId: "ORD-1005",
    customer: "Samuel Peter",
    customerPhone: "+234 808 777 8899",
    rider: "Peter Johnson",
    riderPhone: "+234 809 888 9900",
    business: "City Pharmacy",
    pickup: "Unity Road, Ilorin, Kwara",
    destination: "Fate, Ilorin, Kwara",
    fee: 1200,
    status: "Picked Up",
    date: "Nov 21, 2026",
  },
  {
    id: "DEL-1006",
    orderId: "ORD-1006",
    customer: "Aisha Ibrahim",
    customerPhone: "+234 810 999 0011",
    rider: "Samuel Adeyemi",
    riderPhone: "+234 811 000 1122",
    business: "Daily Needs Market",
    pickup: "Sango, Ilorin, Kwara",
    destination: "Tanke, Ilorin, Kwara",
    fee: 2200,
    status: "Cancelled",
    date: "Nov 20, 2026",
  },
];

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] =
    useState<Delivery[]>(initialDeliveries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedDelivery, setSelectedDelivery] =
    useState<Delivery | null>(null);

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter((d) => d.status === "Pending").length,
    active: deliveries.filter(
      (d) =>
        d.status === "Assigned" ||
        d.status === "Picked Up" ||
        d.status === "In Transit"
    ).length,
    delivered: deliveries.filter((d) => d.status === "Delivered").length,
  };

  const filteredDeliveries = useMemo(() => {
    const query = search.toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesSearch =
        delivery.id.toLowerCase().includes(query) ||
        delivery.orderId.toLowerCase().includes(query) ||
        delivery.customer.toLowerCase().includes(query) ||
        delivery.rider.toLowerCase().includes(query) ||
        delivery.business.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || delivery.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deliveries, search, statusFilter]);

  const updateStatus = (id: string, status: DeliveryStatus) => {
    setDeliveries((current) =>
      current.map((delivery) =>
        delivery.id === id ? { ...delivery, status } : delivery
      )
    );

    setSelectedDelivery((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const statusStyle = (status: DeliveryStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Assigned":
        return "bg-blue-100 text-blue-700";
      case "Picked Up":
        return "bg-indigo-100 text-indigo-700";
      case "In Transit":
        return "bg-purple-100 text-purple-700";
      case "Delivered":
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
          Deliveries Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage deliveries across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Deliveries</p>
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.active}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Delivered</p>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.delivered}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">All Deliveries</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review delivery progress and rider assignments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search deliveries..."
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
              <option value="Assigned">Assigned</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Delivery</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Rider</th>
                <th className="px-5 py-3 font-medium">Delivery Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{delivery.id}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Order: {delivery.orderId}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{delivery.customer}</p>
                    <p className="mt-1 text-xs text-gray-500">{delivery.business}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{delivery.rider}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {formatCurrency(delivery.fee)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(delivery.status)}`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedDelivery(delivery)}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
                      title="View delivery"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No deliveries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
          Showing {filteredDeliveries.length} of {deliveries.length} deliveries
        </div>
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="font-semibold text-gray-900">Delivery Details</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedDelivery.id} · {selectedDelivery.orderId}
                </p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(selectedDelivery.status)}`}>
                  {selectedDelivery.status}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(selectedDelivery.fee)}
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedDelivery.customer}</p>
                    <p>{selectedDelivery.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Rider: {selectedDelivery.rider}</p>
                    <p>{selectedDelivery.riderPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span>{selectedDelivery.business}</span>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Pickup Location</p>
                    <p>{selectedDelivery.pickup}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Delivery Destination</p>
                    <p>{selectedDelivery.destination}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{selectedDelivery.date}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Update Delivery Status
                </label>
                <select
                  value={selectedDelivery.status}
                  onChange={(event) =>
                    updateStatus(
                      selectedDelivery.id,
                      event.target.value as DeliveryStatus
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedDelivery(null)}
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
          Delivery records and status changes are stored only in frontend state.
          No real deliveries or rider assignments are modified.
        </p>
      </div>
    </div>
  );
}
