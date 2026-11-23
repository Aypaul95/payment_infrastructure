
import { useState } from "react";
import {
    Wallet,
    Package,
    CheckCircle2,
    Clock,
    MapPin,
    ArrowRight,
    TrendingUp,
    Power,
    Bike,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
    {
        title: "Today's Earnings",
        value: "₦8,500",
        note: "Demo earnings",
        icon: Wallet,
        color: "bg-emerald-50 text-emerald-600",
    },
    {
        title: "Today's Deliveries",
        value: "6",
        note: "Assigned today",
        icon: Package,
        color: "bg-blue-50 text-blue-600",
    },
    {
        title: "Completed",
        value: "4",
        note: "Successfully delivered",
        icon: CheckCircle2,
        color: "bg-purple-50 text-purple-600",
    },
    {
        title: "Pending",
        value: "2",
        note: "Awaiting completion",
        icon: Clock,
        color: "bg-amber-50 text-amber-600",
    },
];

const recentDeliveries = [
    {
        id: "DEL-1001",
        customer: "John Customer",
        destination: "Tanke, Ilorin",
        amount: 2500,
        status: "Delivered",
        time: "10:30 AM",
    },
    {
        id: "DEL-1002",
        customer: "Sarah Johnson",
        destination: "GRA, Ilorin",
        amount: 3000,
        status: "Delivered",
        time: "11:45 AM",
    },
    {
        id: "DEL-1003",
        customer: "David James",
        destination: "Fate, Ilorin",
        amount: 3000,
        status: "In Progress",
        time: "12:20 PM",
    },
];

export default function RiderDashboardPage() {
    const [isOnline, setIsOnline] = useState(true);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Good morning, Demo Rider!
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Here's an overview of your delivery activity today.
                    </p>
                </div>

                <button
                    onClick={() => setIsOnline((current) => !current)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                        isOnline
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                >
                    <Power size={18} />
                    {isOnline ? "You're Online" : "You're Offline"}
                </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`rounded-xl p-3 ${stat.color}`}>
                                    <Icon size={22} />
                                </div>
                                <TrendingUp
                                    size={18}
                                    className="text-emerald-500"
                                />
                            </div>

                            <p className="mt-5 text-sm text-slate-500">
                                {stat.title}
                            </p>
                            <h3 className="mt-1 text-2xl font-bold text-slate-900">
                                {stat.value}
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                {stat.note}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900">
                                Active Delivery
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Your current delivery assignment
                            </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                            In Progress
                        </span>
                    </div>

                    <div className="mt-6 rounded-xl bg-slate-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                <Bike size={24} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">
                                    DEL-1003
                                </p>
                                <p className="text-xs text-slate-500">
                                    Delivery in progress
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-5">
                            <div className="flex gap-3">
                                <div className="mt-1 text-emerald-600">
                                    <MapPin size={19} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Pickup Location
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Fresh Basket Store
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Tanke, Ilorin
                                    </p>
                                </div>
                            </div>

                            <div className="ml-2 h-5 border-l-2 border-dashed border-slate-300" />

                            <div className="flex gap-3">
                                <div className="mt-1 text-red-500">
                                    <MapPin size={19} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Delivery Destination
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        David James
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Fate, Ilorin
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Delivery Earnings
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                    ₦3,000
                                </p>
                            </div>

                            <Link
                                to="/rider/deliveries"
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                                View Delivery
                                <ArrowRight size={17} />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-bold text-slate-900">
                        Quick Actions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your delivery work
                    </p>

                    <div className="mt-5 space-y-3">
                        <Link
                            to="/rider/requests"
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                            <div className="flex items-center gap-3">
                                <Package className="text-emerald-600" size={20} />
                                <span className="text-sm font-medium text-slate-700">
                                    Find Deliveries
                                </span>
                            </div>
                            <ArrowRight size={17} className="text-slate-400" />
                        </Link>

                        <Link
                            to="/rider/deliveries"
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                            <div className="flex items-center gap-3">
                                <Bike className="text-emerald-600" size={20} />
                                <span className="text-sm font-medium text-slate-700">
                                    My Deliveries
                                </span>
                            </div>
                            <ArrowRight size={17} className="text-slate-400" />
                        </Link>

                        <Link
                            to="/rider/earnings"
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                            <div className="flex items-center gap-3">
                                <Wallet className="text-emerald-600" size={20} />
                                <span className="text-sm font-medium text-slate-700">
                                    View Earnings
                                </span>
                            </div>
                            <ArrowRight size={17} className="text-slate-400" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900">
                            Recent Deliveries
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Your latest delivery activity
                        </p>
                    </div>

                    <Link
                        to="/rider/deliveries"
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                        View All
                    </Link>
                </div>

                <div className="space-y-4">
                    {recentDeliveries.map((delivery) => (
                        <div
                            key={delivery.id}
                            className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {delivery.id}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {delivery.customer} · {delivery.destination}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {delivery.time}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                                <span className="font-semibold text-slate-900">
                                    ₦{delivery.amount.toLocaleString("en-NG")}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        delivery.status === "Delivered"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-blue-50 text-blue-600"
                                    }`}
                                >
                                    {delivery.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-center text-xs text-slate-400">
                Rider dashboard uses sample demonstration data. Live delivery
                assignments and earnings will be connected to the backend later.
            </p>
        </div>
    );
}
