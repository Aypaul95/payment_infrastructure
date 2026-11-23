
import { useMemo, useState } from "react";
import {
  Search,
  Truck,
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  User,
  Phone,
  XCircle,
  ClipboardList,
} from "lucide-react";

type DeliveryStatus =
  | "Awaiting Rider"
  | "Assigned"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

type Delivery = {
  id: string;
  deliveryNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  riderName: string | null;
  riderPhone: string | null;
  deliveryFee: number;
  status: DeliveryStatus;
  createdAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

const sampleDeliveries: Delivery[] = [
  {
    id: "1",
    deliveryNumber: "DEL-2026-001",
    orderNumber: "ORD-2026-003",
    customerName: "Fatima Ibrahim",
    customerPhone: "08034567890",
    pickupAddress: "CommerceHub Store, GRA, Ilorin",
    deliveryAddress: "Unity Road, Ilorin, Kwara State",
    riderName: null,
    riderPhone: null,
    deliveryFee: 1500,
    status: "Awaiting Rider",
    createdAt: "2026-11-20T09:15:00",
    pickedUpAt: null,
    deliveredAt: null,
  },
  {
    id: "2",
    deliveryNumber: "DEL-2026-002",
    orderNumber: "ORD-2026-005",
    customerName: "Grace Eze",
    customerPhone: "08056789012",
    pickupAddress: "CommerceHub Store, GRA, Ilorin",
    deliveryAddress: "Sango, Ilorin, Kwara State",
    riderName: "Ibrahim Musa",
    riderPhone: "08011112222",
    deliveryFee: 2000,
    status: "In Transit",
    createdAt: "2026-11-20T08:30:00",
    pickedUpAt: "2026-11-20T09:00:00",
    deliveredAt: null,
  },
  {
    id: "3",
    deliveryNumber: "DEL-2026-003",
    orderNumber: "ORD-2026-002",
    customerName: "David Okafor",
    customerPhone: "08023456789",
    pickupAddress: "CommerceHub Store, GRA, Ilorin",
    deliveryAddress: "Tanke, Ilorin, Kwara State",
    riderName: "Musa Abdullahi",
    riderPhone: "08022223333",
    deliveryFee: 1800,
    status: "Assigned",
    createdAt: "2026-11-20T08:00:00",
    pickedUpAt: null,
    deliveredAt: null,
  },
  {
    id: "4",
    deliveryNumber: "DEL-2026-004",
    orderNumber: "ORD-2026-006",
    customerName: "Michael Bello",
    customerPhone: "08067890123",
    pickupAddress: "CommerceHub Store, GRA, Ilorin",
    deliveryAddress: "Offa Garage, Ilorin, Kwara State",
    riderName: "Abdul Kareem",
    riderPhone: "08033334444",
    deliveryFee: 1500,
    status: "Delivered",
    createdAt: "2026-11-19T17:30:00",
    pickedUpAt: "2026-11-19T17:50:00",
    deliveredAt: "2026-11-19T18:30:00",
  },
  {
    id: "5",
    deliveryNumber: "DEL-2026-005",
    orderNumber: "ORD-2026-001",
    customerName: "Amina Yusuf",
    customerPhone: "08012345678",
    pickupAddress: "CommerceHub Store, GRA, Ilorin",
    deliveryAddress: "GRA, Ilorin, Kwara State",
    riderName: null,
    riderPhone: null,
    deliveryFee: 2500,
    status: "Awaiting Rider",
    createdAt: "2026-11-20T09:45:00",
    pickedUpAt: null,
    deliveredAt: null,
  },
];

const deliveryStatuses: Array<DeliveryStatus | "All Statuses"> = [
  "All Statuses",
  "Awaiting Rider",
  "Assigned",
  "Picked Up",
  "In Transit",
  "Delivered",
  "Cancelled",
];

const sampleRiders = [
  { name: "Ibrahim Musa", phone: "08011112222" },
  { name: "Musa Abdullahi", phone: "08022223333" },
  { name: "Abdul Kareem", phone: "08033334444" },
  { name: "Suleiman Bello", phone: "08044445555" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Not yet";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusStyle(status: DeliveryStatus) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "In Transit":
      return "bg-indigo-100 text-indigo-700";
    case "Picked Up":
      return "bg-purple-100 text-purple-700";
    case "Assigned":
      return "bg-blue-100 text-blue-700";
    case "Awaiting Rider":
      return "bg-amber-100 text-amber-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState(sampleDeliveries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DeliveryStatus | "All Statuses">("All Statuses");
  const [selectedDelivery, setSelectedDelivery] =
    useState<Delivery | null>(null);
  const [assigningRider, setAssigningRider] = useState(false);
  const [selectedRider, setSelectedRider] = useState("");

  const updateDelivery = (
    deliveryId: string,
    updates: Partial<Delivery>
  ) => {
    setDeliveries((previous) =>
      previous.map((delivery) =>
        delivery.id === deliveryId
          ? { ...delivery, ...updates }
          : delivery
      )
    );

    setSelectedDelivery((previous) =>
      previous?.id === deliveryId
        ? { ...previous, ...updates }
        : previous
    );
  };

  const handleAssignRider = () => {
    const rider = sampleRiders.find(
      (item) => item.name === selectedRider
    );

    if (!rider || !selectedDelivery) return;

    updateDelivery(selectedDelivery.id, {
      riderName: rider.name,
      riderPhone: rider.phone,
      status: "Assigned",
    });

    setAssigningRider(false);
    setSelectedRider("");
  };

  const handlePickup = () => {
    if (!selectedDelivery) return;

    updateDelivery(selectedDelivery.id, {
      status: "Picked Up",
      pickedUpAt: new Date().toISOString(),
    });
  };

  const handleStartTransit = () => {
    if (!selectedDelivery) return;

    updateDelivery(selectedDelivery.id, {
      status: "In Transit",
    });
  };

  const handleDelivered = () => {
    if (!selectedDelivery) return;

    const confirmed = window.confirm(
      "Confirm that this delivery has been completed?"
    );

    if (!confirmed) return;

    updateDelivery(selectedDelivery.id, {
      status: "Delivered",
      deliveredAt: new Date().toISOString(),
    });
  };

  const handleCancel = () => {
    if (!selectedDelivery) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this delivery?"
    );

    if (!confirmed) return;

    updateDelivery(selectedDelivery.id, {
      status: "Cancelled",
    });
  };

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const term = search.toLowerCase();

      const matchesSearch =
        delivery.deliveryNumber.toLowerCase().includes(term) ||
        delivery.orderNumber.toLowerCase().includes(term) ||
        delivery.customerName.toLowerCase().includes(term) ||
        delivery.customerPhone.includes(search) ||
        (delivery.riderName?.toLowerCase().includes(term) ?? false);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        delivery.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deliveries, search, statusFilter]);

  const totalDeliveries = deliveries.length;

  const awaitingRider = deliveries.filter(
    (delivery) => delivery.status === "Awaiting Rider"
  ).length;

  const assignedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "Assigned"
  ).length;

  const inTransit = deliveries.filter(
    (delivery) =>
      delivery.status === "Picked Up" ||
      delivery.status === "In Transit"
  ).length;

  const completedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "Delivered"
  ).length;

  const totalDeliveryFees = deliveries
    .filter((delivery) => delivery.status === "Delivered")
    .reduce((total, delivery) => total + delivery.deliveryFee, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Deliveries
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage delivery requests, riders, and order fulfillment.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Deliveries</p>
            <ClipboardList className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalDeliveries}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Awaiting Rider</p>
            <Clock className="text-amber-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {awaitingRider}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Assigned</p>
            <User className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {assignedDeliveries}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">In Transit</p>
            <Truck className="text-indigo-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {inTransit}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Delivered</p>
            <CheckCircle2 className="text-green-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {completedDeliveries}
          </p>
        </div>
      </div>

      {/* Delivery fee summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          Delivery Fees from Completed Deliveries
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900">
          {formatCurrency(totalDeliveryFees)}
        </p>
      </div>

      {/* Search and filters */}
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
              placeholder="Search delivery, order, customer, or rider..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as DeliveryStatus | "All Statuses"
              )
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {deliveryStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deliveries table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            All Deliveries
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredDeliveries.length} deliveries found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Delivery</th>
                <th className="px-5 py-4">Order / Customer</th>
                <th className="px-5 py-4">Rider</th>
                <th className="px-5 py-4">Destination</th>
                <th className="px-5 py-4">Delivery Fee</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {delivery.deliveryNumber}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-900">
                        {delivery.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {delivery.customerName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm text-slate-700">
                        {delivery.riderName ?? "Not assigned"}
                      </p>
                      {delivery.riderPhone && (
                        <p className="mt-1 text-xs text-slate-500">
                          {delivery.riderPhone}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-48 text-sm text-slate-600">
                        {delivery.deliveryAddress}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(delivery.deliveryFee)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusStyle(delivery.status)}`}
                      >
                        {delivery.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setAssigningRider(false);
                        }}
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

      {/* Delivery details modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Delivery Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDelivery.deliveryNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDelivery(null);
                  setAssigningRider(false);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Status and order */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Delivery Status</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle(selectedDelivery.status)}`}
                  >
                    {selectedDelivery.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Order Number</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedDelivery.orderNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Delivery Fee</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatCurrency(selectedDelivery.deliveryFee)}
                  </p>
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Customer Information
                </h3>
                <div className="mt-3 space-y-3 text-sm">
                  <p className="flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    {selectedDelivery.customerName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    {selectedDelivery.customerPhone}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Delivery Route
                </h3>
                <div className="mt-4 space-y-5">
                  <div className="flex gap-3">
                    <Package size={19} className="mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup Address</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {selectedDelivery.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin size={19} className="mt-0.5 text-green-600" />
                    <div>
                      <p className="text-xs text-slate-500">Delivery Address</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {selectedDelivery.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Rider Information
                </h3>

                {selectedDelivery.riderName ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Name: </span>
                      <span className="font-medium text-slate-900">
                        {selectedDelivery.riderName}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Phone: </span>
                      <span className="font-medium text-slate-900">
                        {selectedDelivery.riderPhone}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-amber-600">
                    No rider has been assigned to this delivery.
                  </p>
                )}

                {assigningRider && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <label className="block text-sm font-medium text-slate-700">
                      Select Rider
                    </label>
                    <select
                      value={selectedRider}
                      onChange={(event) =>
                        setSelectedRider(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Choose a rider</option>
                      {sampleRiders.map((rider) => (
                        <option key={rider.name} value={rider.name}>
                          {rider.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!selectedRider}
                        onClick={handleAssignRider}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirm Assignment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningRider(false);
                          setSelectedRider("");
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">
                  Delivery Timeline
                </h3>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      Delivery Created
                    </p>
                    <p className="mt-1 text-slate-500">
                      {formatDate(selectedDelivery.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      Picked Up
                    </p>
                    <p className="mt-1 text-slate-500">
                      {formatDate(selectedDelivery.pickedUpAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      Delivered
                    </p>
                    <p className="mt-1 text-slate-500">
                      {formatDate(selectedDelivery.deliveredAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col gap-3 border-t border-slate-200 p-6">
              <div className="flex flex-wrap gap-2">
                {selectedDelivery.status !== "Delivered" &&
                  selectedDelivery.status !== "Cancelled" &&
                  !assigningRider && (
                    <>
                      {selectedDelivery.status === "Awaiting Rider" && (
                        <button
                          type="button"
                          onClick={() => setAssigningRider(true)}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Assign Rider
                        </button>
                      )}

                      {selectedDelivery.status === "Assigned" && (
                        <button
                          type="button"
                          onClick={handlePickup}
                          className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
                        >
                          Mark Picked Up
                        </button>
                      )}

                      {selectedDelivery.status === "Picked Up" && (
                        <button
                          type="button"
                          onClick={handleStartTransit}
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Start Transit
                        </button>
                      )}

                      {selectedDelivery.status === "In Transit" && (
                        <button
                          type="button"
                          onClick={handleDelivered}
                          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {selectedDelivery.status !== "Awaiting Rider" && (
                        <button
                          type="button"
                          onClick={() => setAssigningRider(true)}
                          className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Change Rider
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <XCircle size={17} />
                        Cancel Delivery
                      </button>
                    </>
                  )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDelivery(null);
                    setAssigningRider(false);
                  }}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveriesPage;
