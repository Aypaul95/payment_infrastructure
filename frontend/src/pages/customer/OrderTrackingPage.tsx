
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    MapPin,
    Package,
    ShoppingBag,
    Truck,
} from "lucide-react";

const trackingSteps = [
    {
        title: "Order Placed",
        description: "Your order has been received.",
        completed: true,
        icon: ShoppingBag,
    },
    {
        title: "Payment Confirmed",
        description: "Your payment has been verified.",
        completed: true,
        icon: CheckCircle2,
    },
    {
        title: "Order Processing",
        description: "The vendor is preparing your order.",
        completed: true,
        icon: Package,
    },
    {
        title: "Ready for Delivery",
        description: "Your order is ready for rider pickup.",
        completed: false,
        icon: CheckCircle2,
    },
    {
        title: "Out for Delivery",
        description: "Your rider is on the way.",
        completed: false,
        icon: Truck,
    },
    {
        title: "Delivered",
        description: "Your order has been delivered.",
        completed: false,
        icon: MapPin,
    },
];

export default function OrderTrackingPage() {
    const { orderId } = useParams();

    // Temporary demonstration data.
    // Real order information will come from the backend API.
    const orderNumber = orderId || "DEMO-1001";
    const currentStatus = "Processing";

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
                to="/store/orders"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
                <ArrowLeft size={18} />
                Back to My Orders
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Track Your Order
                </h1>
                <p className="mt-2 text-slate-500">
                    Follow your order as it moves from the vendor to your doorstep.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Order Number
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {orderNumber}
                                </h2>
                            </div>

                            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                                {currentStatus}
                            </span>
                        </div>

                        <div className="mt-6 rounded-xl bg-blue-50 p-5">
                            <div className="flex items-center gap-3">
                                <Clock className="h-6 w-6 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        Your order is being processed
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        We'll update your tracking information as
                                        your order progresses.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Delivery Progress
                        </h2>

                        <div className="mt-6 space-y-6">
                            {trackingSteps.map((step, index) => {
                                const StepIcon = step.icon;

                                return (
                                    <div key={step.title} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                    step.completed
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-slate-100 text-slate-400"
                                                }`}
                                            >
                                                <StepIcon size={20} />
                                            </div>

                                            {index !== trackingSteps.length - 1 && (
                                                <div
                                                    className={`mt-2 min-h-8 w-0.5 ${
                                                        step.completed
                                                            ? "bg-green-300"
                                                            : "bg-slate-200"
                                                    }`}
                                                />
                                            )}
                                        </div>

                                        <div className="pb-2">
                                            <p
                                                className={`font-semibold ${
                                                    step.completed
                                                        ? "text-slate-900"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {step.title}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                                <Truck size={22} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Delivery Information
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Rider assignment
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700">
                                Rider not assigned yet
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Rider details will appear here once your order
                                is ready for delivery.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <h2 className="font-bold text-slate-900">
                                Delivery Address
                            </h2>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                            Your saved delivery address will appear here once
                            your order information is connected.
                        </p>
                    </div>

                    <Link
                        to="/store/orders"
                        className="block w-full rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        View My Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}
