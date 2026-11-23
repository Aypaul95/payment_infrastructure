
import { useState } from "react";
import {
    MapPin,
    Package,
    Clock,
    CheckCircle2,
    Truck,
    Navigation,
} from "lucide-react";

interface DeliveryRequest {
    id: string;
    customer: string;
    vendor: string;
    pickup: string;
    destination: string;
    items: number;
    distance: string;
    fee: number;
    time: string;
}

const initialRequests: DeliveryRequest[] = [
    {
        id: "DEL-2001",
        customer: "Michael Johnson",
        vendor: "Mama's Kitchen",
        pickup: "Tanke, Ilorin",
        destination: "Unity Road, Ilorin",
        items: 2,
        distance: "3.2 km",
        fee: 2500,
        time: "10 minutes ago",
    },
    {
        id: "DEL-2002",
        customer: "Grace Williams",
        vendor: "Fresh Basket",
        pickup: "Fate, Ilorin",
        destination: "GRA, Ilorin",
        items: 4,
        distance: "5.5 km",
        fee: 3500,
        time: "18 minutes ago",
    },
    {
        id: "DEL-2003",
        customer: "Peter Adams",
        vendor: "HealthPlus Store",
        pickup: "Post Office, Ilorin",
        destination: "Tanke, Ilorin",
        items: 1,
        distance: "4.1 km",
        fee: 3000,
        time: "25 minutes ago",
    },
];

export default function DeliveryRequestsPage() {
    const [requests, setRequests] = useState(initialRequests);
    const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

    const handleAccept = (id: string) => {
        setAcceptedIds((current) => [...current, id]);
        setRequests((current) =>
            current.filter((request) => request.id !== id),
        );
    };

    const totalPotentialEarnings = requests.reduce(
        (total, request) => total + request.fee,
        0,
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Delivery Requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Find available deliveries and accept jobs that suit you.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Package size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Available Requests
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        {requests.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <Truck size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Accepted Requests
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        {acceptedIds.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <Navigation size={22} />
                        </div>
                        <p className="text-sm text-slate-500">
                            Available Delivery Fees
                        </p>
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                        ₦{totalPotentialEarnings.toLocaleString("en-NG")}
                    </p>
                </div>
            </div>

            {acceptedIds.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2
                        className="mt-0.5 shrink-0 text-emerald-600"
                        size={20}
                    />
                    <div>
                        <p className="font-semibold text-emerald-800">
                            Demo delivery accepted
                        </p>
                        <p className="mt-1 text-sm text-emerald-700">
                            {acceptedIds.length} request(s) accepted in this
                            session. This action is not yet saved to the backend.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {requests.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Package size={30} />
                        </div>
                        <h3 className="mt-5 font-semibold text-slate-900">
                            No available requests
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            You've accepted all the demo requests currently available.
                        </p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <div
                            key={request.id}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {request.id}
                                        </h3>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                            Available
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Requested by {request.customer}
                                    </p>
                                </div>

                                <div className="sm:text-right">
                                    <p className="text-xs text-slate-500">
                                        Delivery Fee
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        ₦{request.fee.toLocaleString("en-NG")}
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
                                            {request.vendor}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {request.pickup}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <MapPin
                                        size={20}
                                        className="mt-1 shrink-0 text-red-500"
                                    />
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Delivery Destination
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {request.customer}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {request.destination}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Package size={17} />
                                    {request.items} item(s)
                                </span>
                                <span className="flex items-center gap-2">
                                    <Navigation size={17} />
                                    {request.distance}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock size={17} />
                                    {request.time}
                                </span>
                            </div>

                            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                                <button
                                    onClick={() => handleAccept(request.id)}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <CheckCircle2 size={18} />
                                    Accept Delivery
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="text-center text-xs text-slate-400">
                Sample delivery requests for demonstration only. Live request
                discovery and assignment will be connected to the backend later.
            </p>
        </div>
    );
}
