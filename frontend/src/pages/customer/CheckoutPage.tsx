
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    ShoppingBag,
    Truck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
    const { items, cartTotal } = useCart();
    const navigate = useNavigate();

    // Temporary demo pricing. Replace with backend pricing later.
    const deliveryFee = 1500;
    const serviceFee = 200;
    const orderTotal = cartTotal + deliveryFee + serviceFee;

    const [fullName, setFullName] = useState(
        () => sessionStorage.getItem("checkout_fullName") || "",
    );
    const [phone, setPhone] = useState(
        () => sessionStorage.getItem("checkout_phone") || "",
    );
    const [address, setAddress] = useState(
        () => sessionStorage.getItem("checkout_address") || "",
    );
    const [city, setCity] = useState(
        () => sessionStorage.getItem("checkout_city") || "",
    );
    const [instructions, setInstructions] = useState(
        () => sessionStorage.getItem("checkout_instructions") || "",
    );
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        sessionStorage.setItem("checkout_fullName", fullName);
        sessionStorage.setItem("checkout_phone", phone);
        sessionStorage.setItem("checkout_address", address);
        sessionStorage.setItem("checkout_city", city);
        sessionStorage.setItem("checkout_instructions", instructions);
    }, [fullName, phone, address, city, instructions]);
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);
        navigate("/store/payment");
    };

    if (items.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                <h1 className="text-2xl font-bold text-slate-900">
                    Your cart is empty
                </h1>
                <p className="mt-2 text-slate-500">
                    Add products to your cart before proceeding to checkout.
                </p>
                <Link
                    to="/store"
                    className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
                to="/store/cart"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
                <ArrowLeft size={18} />
                Back to Cart
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Checkout
                </h1>
                <p className="mt-2 text-slate-500">
                    Enter your delivery details to continue.
                </p>
            </div>

            {submitted && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Delivery address details captured for this checkout.
                    Delivery pricing and payment will be added in the next steps.
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Delivery Address
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Where should we deliver your order?
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Enter your full name"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="e.g. 08012345678"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Delivery Address
                            </label>
                            <textarea
                                value={address}
                                onChange={(event) => setAddress(event.target.value)}
                                placeholder="House number, street name, landmark..."
                                rows={3}
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                City / Town
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(event) => setCity(event.target.value)}
                                placeholder="Enter your city or town"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Delivery Instructions (Optional)
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(event) => setInstructions(event.target.value)}
                                placeholder="Nearby landmarks or special instructions..."
                                rows={2}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
                        >
                            Continue to Delivery
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Order Summary
                        </h2>

                        <div className="mt-5 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-14 w-14 rounded-lg object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Quantity: {item.quantity}
                                        </p>
                                    </div>

                                    <p className="text-sm font-semibold text-slate-900">
                                        ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="my-5 border-t border-slate-200" />

                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>₦{cartTotal.toLocaleString("en-NG")}</span>
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-slate-600">
                            <span className="flex items-center gap-2">
                                <Truck size={16} />
                                Delivery Fee
                            </span>
                            <span>₦{deliveryFee.toLocaleString("en-NG")}</span>
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-slate-600">
                            <span>Service Fee</span>
                            <span>₦{serviceFee.toLocaleString("en-NG")}</span>
                        </div>

                        <div className="my-5 border-t border-slate-200" />

                        <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>Total Amount</span>
                            <span>₦{orderTotal.toLocaleString("en-NG")}</span>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-slate-500">
                            Delivery charges and the final order total will be
                            calculated after your delivery address is provided.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
