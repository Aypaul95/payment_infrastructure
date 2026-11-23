
import { useState, type FormEvent } from "react";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Save,
    ShieldCheck,
} from "lucide-react";

export default function CustomerProfilePage() {
    const [fullName, setFullName] = useState(
        () => localStorage.getItem("customer_fullName") || "",
    );
    const [email, setEmail] = useState(
        () => localStorage.getItem("customer_email") || "",
    );
    const [phone, setPhone] = useState(
        () => localStorage.getItem("customer_phone") || "",
    );
    const [address, setAddress] = useState(
        () => localStorage.getItem("customer_address") || "",
    );
    const [city, setCity] = useState(
        () => localStorage.getItem("customer_city") || "",
    );
    const [saved, setSaved] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        localStorage.setItem("customer_fullName", fullName);
        localStorage.setItem("customer_email", email);
        localStorage.setItem("customer_phone", phone);
        localStorage.setItem("customer_address", address);
        localStorage.setItem("customer_city", city);

        setSaved(true);
    };

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    My Profile
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage your personal information and delivery address.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <User size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Personal Information
                            </h2>
                            <p className="text-sm text-slate-500">
                                Your basic contact details.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Full Name
                            </label>
                            <input
                                required
                                value={fullName}
                                onChange={(event) => {
                                    setFullName(event.target.value);
                                    setSaved(false);
                                }}
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={17} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setSaved(false);
                                    }}
                                    placeholder="you@example.com"
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-400" size={17} />
                                <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={(event) => {
                                        setPhone(event.target.value);
                                        setSaved(false);
                                    }}
                                    placeholder="Enter your phone number"
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <MapPin size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Delivery Address
                            </h2>
                            <p className="text-sm text-slate-500">
                                Save your preferred delivery location.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Street Address
                            </label>
                            <input
                                value={address}
                                onChange={(event) => {
                                    setAddress(event.target.value);
                                    setSaved(false);
                                }}
                                placeholder="House number, street name, area"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                City / Town
                            </label>
                            <input
                                value={city}
                                onChange={(event) => {
                                    setCity(event.target.value);
                                    setSaved(false);
                                }}
                                placeholder="Enter your city or town"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={20} />
                    <p className="text-sm leading-6 text-blue-800">
                        This is a frontend demo. Your profile information is
                        stored in this browser only. Account authentication
                        and secure server-side profile storage will be
                        connected later.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    {saved && (
                        <p className="text-sm font-medium text-emerald-600">
                            Profile saved successfully.
                        </p>
                    )}

                    <button
                        type="submit"
                        className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Save size={18} />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
}
