
import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarDays,
    Package,
    ShoppingBag,
} from "lucide-react";

const orders = [
    {
        id: "DEMO-1001",
        date: "November 20, 2026",
        items: 3,
        total: 8500,
        paymentStatus: "Paid",
        deliveryStatus: "Processing",
    },
    {
        id: "DEMO-1002",
        date: "November 15, 2026",
        items: 2,
        total: 5200,
        paymentStatus: "Paid",
        deliveryStatus: "Delivered",
    },
    {
        id: "DEMO-1003",
        date: "November 10, 2026",
        items: 1,
        total: 3500,
        paymentStatus: "Paid",
        deliveryStatus: "Delivered",
    },
];

export default function OrderHistoryPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    My Orders
                </h1>
                <p className="mt-2 text-slate-500">
                    View your previous purchases and track current orders.
                </p>
            </div>

            <div className="space-y-5">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Order Number
                                </p>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">
                                    {order.id}
                                </h2>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    order.deliveryStatus === "Delivered"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                            >
                                {order.deliveryStatus}
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 border-y border-slate-100 py-5 sm:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Order Date
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {order.date}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Items
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {order.items} products
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Payment
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-green-700">
                                        {order.paymentStatus}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Order Total
                                </p>
                                <p className="mt-1 text-xl font-bold text-slate-900">
                                    ₦{order.total.toLocaleString("en-NG")}
                                </p>
                            </div>

                            <Link
                                to={`/store/orders/${order.id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Track Order
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
