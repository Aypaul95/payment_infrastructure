
import { useState } from "react";
import {
    Package,
    MapPin,
    Clock,
    CheckCircle2,
    Truck,
    Navigation,
    ArrowRight,
} from "lucide-react";

type DeliveryStatus =
    | "Accepted"
    | "Picked Up"
    | "In Transit"
    | "Delivered";

interface Delivery {
    id: string;
    customer: string;
    vendor: string;
    pickup: string;
    destination: string;
    fee: number;
    items: number;
    status: DeliveryStatus;
    time: string;
}

const initialDeliveries: Delivery[] = [
    {
        id: "DEL-1003",
        customer: "David James",
        vendor: "Fresh Basket",
        pickup: "Tanke, Ilorin",
        destination: "Fate, Ilorin",
        fee: 3000,
        items: 3,
        status: "In Transit",
        time: "12:20 PM",
    },
    {
        id: "DEL-1004",
        customer: "Mary Adams",
        vendor: "Mama's Kitchen",
        pickup: "Unity Road, Ilorin",
        destination: "GRA, Ilorin",
        fee: 2500,
        items: 2,
        status: "Accepted",
        time: "1:15 PM",
    },
    {
        id: "DEL-1005",
        customer: "Samuel Peter",
        vendor: "HealthPlus Store",
        pickup: "Post Office, Ilorin",
        destination: "Tanke, Ilorin",
        fee: 3500,
        items: 1,
        status: "Delivered",
        time: "9:45 AM",
    },
];

const statusStyles: Record<DeliveryStatus, string> = {
    Accepted: "bg-blue-50 text-blue-600",
    "Picked Up": "bg-amber-50 text-amber-600",
    "In Transit": "bg-purple-50 text-purple-600",
    Delivered: "bg-emerald-50 text-emerald-600",
};

const nextStatus: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
    Accepted: "Picked Up",
    "Picked Up": "In Transit",
    "In Transit": "Delivered",
};

export default function MyDeliveriesPage() {
    const [deliveries, setDeliveries] = useState(initialDeliveries);
    const [filter, setFilter] = useState("All");

    const updateStatus = (id: string) => {
        setDeliveries((current) =>
            current.map((delivery) =>
                delivery.id === id && nextStatus[delivery.status]
                    ? {
                          ...delivery,
                          status: nextStatus[delivery.status]!,
                      }
                    : delivery,
            ),
        );
    };

    const filteredDeliveries =
        filter === "All"
            ? deliveries
            : deliveries.filter((delivery) => delivery.status === filter);

    const activeCount = deliveries.filter(
        (delivery) => delivery.status !== "Delivered",
    ).length;

    const completedCount = deliveries.filter(
        (delivery) => delivery.status === "Delivered",
    ).length;

    const filters = [
        "All",
        "Accepted",
        "Picked Up",
        "In Transit",
        "Delivered",
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    My Deliveries
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Manage your assigned deliveries and update their progress.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Package size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Total Deliveries
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        {deliveries.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <Truck size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Active Deliveries
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        {activeCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <CheckCircle2 size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Completed Deliveries
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        {completedCount}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                    <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                            filter === item
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {filteredDeliveries.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                        <Package
                            size={32}
                            className="mx-auto text-slate-300"
                        />
                        <h3 className="mt-4 font-semibold text-slate-900">
                            No deliveries found
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            There are no deliveries in this status.
                        </p>
                    </div>
                ) : (
                    filteredDeliveries.map((delivery) => (
                        <div
                            key={delivery.id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {delivery.id}
                                        </h3>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[delivery.status]}`}
                                        >
                                            {delivery.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Customer: {delivery.customer}
                                    </p>
                                </div>

                                <div className="sm:text-right">
                                    <p className="text-xs text-slate-500">
                                        Delivery Fee
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                        ₦{delivery.fee.toLocaleString("en-NG")}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-5 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
                                <div className="flex gap-3">
                                    <MapPin
                                        size={20}
                                        className="mt-1 shrink-0 text-emerald-600"
                                    />
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Pickup Location
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {delivery.vendor}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {delivery.pickup}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Navigation
                                        size={20}
                                        className="mt-1 shrink-0 text-red-500"
                                    />
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Delivery Destination
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {delivery.customer}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {delivery.destination}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Package size={17} />
                                    {delivery.items} item(s)
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock size={17} />
                                    {delivery.time}
                                </span>
                            </div>

                            {nextStatus[delivery.status] && (
                                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                                    <button
                                        onClick={() =>
                                            updateStatus(delivery.id)
                                        }
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        {delivery.status === "Accepted"
                                            ? "Confirm Pickup"
                                            : delivery.status === "Picked Up"
                                              ? "Start Delivery"
                                              : "Mark as Delivered"}
                                        <ArrowRight size={17} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <p className="text-center text-xs text-slate-400">
                Sample delivery data only. Status updates are temporary and
                will be connected to the backend later.
            </p>
        </div>
    );
}
