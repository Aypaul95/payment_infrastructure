import { useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";

type OrderStatus =
  | "Pending Payment"
  | "Paid"
  | "Confirmed"
  | "Processing"
  | "Ready for Delivery"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryAddress: string;
  createdAt: string;
};

const sampleOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2026-001",
    customerName: "Amina Yusuf",
    customerPhone: "08012345678",
    customerEmail: "amina@example.com",
    items: [
      {
        id: "1",
        productName: "Premium Rice 50kg",
        quantity: 1,
        unitPrice: 85000,
      },
      {
        id: "2",
        productName: "Vegetable Oil 5L",
        quantity: 2,
        unitPrice: 12500,
      },
    ],
    subtotal: 110000,
    deliveryFee: 2500,
    serviceFee: 1000,
    total: 113500,
    paymentStatus: "Paid",
    status: "Confirmed",
    deliveryAddress: "GRA, Ilorin, Kwara State",
    createdAt: "2026-11-20T08:15:00",
  },
  {
    id: "2",
    orderNumber: "ORD-2026-002",
    customerName: "David Okafor",
    customerPhone: "08023456789",
    customerEmail: "david@example.com",
    items: [
      {
        id: "1",
        productName: "Indomie Carton",
        quantity: 3,
        unitPrice: 16500,
      },
    ],
    subtotal: 49500,
    deliveryFee: 1800,
    serviceFee: 500,
    total: 51800,
    paymentStatus: "Paid",
    status: "Processing",
    deliveryAddress: "Tanke, Ilorin, Kwara State",
    createdAt: "2026-11-20T07:45:00",
  },
  {
    id: "3",
    orderNumber: "ORD-2026-003",
    customerName: "Fatima Ibrahim",
    customerPhone: "08034567890",
    customerEmail: "fatima@example.com",
    items: [
      {
        id: "1",
        productName: "Bottled Water Pack",
        quantity: 5,
        unitPrice: 3200,
      },
      {
        id: "2",
        productName: "Detergent 2kg",
        quantity: 2,
        unitPrice: 7500,
      },
    ],
    subtotal: 31000,
    deliveryFee: 1500,
    serviceFee: 500,
    total: 33000,
    paymentStatus: "Paid",
    status: "Ready for Delivery",
    deliveryAddress: "Unity Road, Ilorin, Kwara State",
    createdAt: "2026-11-20T07:20:00",
  },
  {
    id: "4",
    orderNumber: "ORD-2026-004",
    customerName: "Samuel Ade",
    customerPhone: "08045678901",
    customerEmail: "samuel@example.com",
    items: [
      {
        id: "1",
        productName: "Premium Rice 50kg",
        quantity: 2,
        unitPrice: 85000,
      },
    ],
    subtotal: 170000,
    deliveryFee: 3000,
    serviceFee: 1500,
    total: 174500,
    paymentStatus: "Pending",
    status: "Pending Payment",
    deliveryAddress: "Fate Road, Ilorin, Kwara State",
    createdAt: "2026-11-20T06:50:00",
  },
  {
    id: "5",
    orderNumber: "ORD-2026-005",
    customerName: "Grace Eze",
    customerPhone: "08056789012",
    customerEmail: "grace@example.com",
    items: [
      {
        id: "1",
        productName: "Vegetable Oil 5L",
        quantity: 4,
        unitPrice: 12500,
      },
    ],
    subtotal: 50000,
    deliveryFee: 2000,
    serviceFee: 500,
    total: 52500,
    paymentStatus: "Paid",
    status: "Out for Delivery",
    deliveryAddress: "Sango, Ilorin, Kwara State",
    createdAt: "2026-11-20T06:25:00",
  },
  {
    id: "6",
    orderNumber: "ORD-2026-006",
    customerName: "Michael Bello",
    customerPhone: "08067890123",
    customerEmail: "michael@example.com",
    items: [
      {
        id: "1",
        productName: "Indomie Carton",
        quantity: 1,
        unitPrice: 16500,
      },
    ],
    subtotal: 16500,
    deliveryFee: 1500,
    serviceFee: 500,
    total: 18500,
    paymentStatus: "Paid",
    status: "Delivered",
    deliveryAddress: "Offa Garage, Ilorin, Kwara State",
    createdAt: "2026-11-19T18:30:00",
  },
  {
    id: "7",
    orderNumber: "ORD-2026-007",
    customerName: "Blessing James",
    customerPhone: "08078901234",
    customerEmail: "blessing@example.com",
    items: [
      {
        id: "1",
        productName: "Detergent 2kg",
        quantity: 3,
        unitPrice: 7500,
      },
    ],
    subtotal: 22500,
    deliveryFee: 2000,
    serviceFee: 500,
    total: 25000,
    paymentStatus: "Paid",
    status: "Cancelled",
    deliveryAddress: "Oke-Odo, Ilorin, Kwara State",
    createdAt: "2026-11-19T16:15:00",
  },
];

const orderStatuses: Array<OrderStatus | "All Statuses"> = [
  "All Statuses",
  "Pending Payment",
  "Paid",
  "Confirmed",
  "Processing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function OrdersPage() {
    const [orders, setOrders] = useState(sampleOrders);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        OrderStatus | "All Statuses"
    >("All Statuses");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const handleOrderStatusUpdate = (
        orderId: string,
        newStatus: OrderStatus
    ) => {
        setOrders((previousOrders) =>
            previousOrders.map((order) =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            )
        );

        setSelectedOrder((previousOrder) =>
            previousOrder?.id === orderId
                ? { ...previousOrder, status: newStatus }
                : previousOrder
        );
    };

    const handleCancelOrder = (orderId: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) return;

        handleOrderStatusUpdate(orderId, "Cancelled");
    };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        order.customerPhone.includes(search);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "Pending Payment" ||
      order.status === "Confirmed"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "Processing"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "Paid")
    .reduce((total, order) => total + order.total, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Orders
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage customer orders, payments, and fulfillment.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Orders</p>
            <ShoppingCart className="text-blue-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending Orders</p>
            <Clock className="text-amber-500" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Processing</p>
            <Truck className="text-indigo-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {processingOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Delivered</p>
            <CheckCircle2 className="text-green-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {completedOrders}
          </p>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          Revenue from Paid Orders
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {formatCurrency(totalRevenue)}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number, customer, or phone..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as OrderStatus | "All Statuses"
              )
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

           {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            All Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {filteredOrders.length} orders found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {order.orderNumber}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-900">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.customerPhone}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}{" "}
                      item(s)
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          order.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : order.paymentStatus === "Failed"
                              ? "bg-red-100 text-red-700"
                              : order.paymentStatus === "Refunded"
                                ? "bg-slate-100 text-slate-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.status === "Out for Delivery"
                                ? "bg-indigo-100 text-indigo-700"
                                : order.status === "Ready for Delivery"
                                  ? "bg-purple-100 text-purple-700"
                                  : order.status === "Processing"
                                    ? "bg-blue-100 text-blue-700"
                                    : order.status === "Pending Payment"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                View
                            </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
           </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Order Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.orderNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Order Status */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Order Status</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedOrder.status}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Payment Status</p>
                  <p
                    className={`mt-1 font-semibold ${
                      selectedOrder.paymentStatus === "Paid"
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Order Date</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Customer Information
                </h3>

                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Name: </span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.customerName}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-500">Phone: </span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.customerPhone}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-500">Email: </span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.customerEmail}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-500">Delivery Address: </span>
                    <span className="font-medium text-slate-900">
                      {selectedOrder.deliveryAddress}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-slate-900">
                  Order Items
                </h3>

                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Unit Price</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {item.productName}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.quantity}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Payment Breakdown
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(selectedOrder.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Delivery Fee</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(selectedOrder.deliveryFee)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Service Fee</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(selectedOrder.serviceFee)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-900">
                        Order Total
                      </span>

                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

                      {/* Modal Footer */}
                      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                              {selectedOrder.status === "Paid" && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleOrderStatusUpdate(selectedOrder.id, "Confirmed")
                                      }
                                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                  >
                                      Confirm Order
                                  </button>
                              )}

                              {selectedOrder.status === "Confirmed" && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleOrderStatusUpdate(selectedOrder.id, "Processing")
                                      }
                                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                  >
                                      Start Processing
                                  </button>
                              )}

                              {selectedOrder.status === "Processing" && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleOrderStatusUpdate(
                                              selectedOrder.id,
                                              "Ready for Delivery"
                                          )
                                      }
                                      className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
                                  >
                                      Mark Ready for Delivery
                                  </button>
                              )}

                              {selectedOrder.status === "Ready for Delivery" && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleOrderStatusUpdate(
                                              selectedOrder.id,
                                              "Out for Delivery"
                                          )
                                      }
                                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                                  >
                                      Request Delivery
                                  </button>
                              )}

                              {selectedOrder.status === "Out for Delivery" && (
                                  <button
                                      type="button"
                                      onClick={() =>
                                          handleOrderStatusUpdate(selectedOrder.id, "Delivered")
                                      }
                                      className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                                  >
                                      Mark Delivered
                                  </button>
                              )}

                              {![
                                  "Pending Payment",
                                  "Delivered",
                                  "Cancelled",
                              ].includes(selectedOrder.status) && (
                                      <button
                                          type="button"
                                          onClick={() => handleCancelOrder(selectedOrder.id)}
                                          className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                      >
                                          <XCircle size={17} />
                                          Cancel Order
                                      </button>
                                  )}
                          </div>

                          <button
                              type="button"
                              onClick={() => setSelectedOrder(null)}
                              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                          >
                              Close Details
                          </button>
                      </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default OrdersPage;