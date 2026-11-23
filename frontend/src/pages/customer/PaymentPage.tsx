
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    LockKeyhole,
    ShieldCheck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function PaymentPage() {
    const { items, cartTotal } = useCart();

    // Temporary demo pricing. Backend pricing will replace these values.
    const deliveryFee = 1500;
    const serviceFee = 200;
    const orderTotal = cartTotal + deliveryFee + serviceFee;

    if (items.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <CreditCard className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                <h1 className="text-2xl font-bold text-slate-900">
                    No order to pay for
                </h1>
                <p className="mt-2 text-slate-500">
                    Your shopping cart is empty.
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
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
                to="/store/checkout"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >
                <ArrowLeft size={18} />
                Back to Checkout
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Complete Your Payment
                </h1>
                <p className="mt-2 text-slate-500">
                    Review your order total and choose how you would like to pay.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <CreditCard size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Payment Method
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Secure payment powered by Paystack
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border-2 border-blue-500 bg-blue-50/50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-white p-3">
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Paystack
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Cards, bank transfer and other supported methods
                                        </p>
                                    </div>
                                </div>

                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                            <p className="text-sm leading-6 text-slate-600">
                                Your payment will be processed securely through
                                Paystack. Your card details will not be stored
                                by CommerceHub.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Secure Checkout
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Payment verification will be handled by our backend.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Payment Summary
                        </h2>

                        <div className="mt-5 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
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

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Product Subtotal</span>
                                <span>₦{cartTotal.toLocaleString("en-NG")}</span>
                            </div>

                            <div className="flex justify-between text-slate-600">
                                <span>Delivery Fee</span>
                                <span>₦{deliveryFee.toLocaleString("en-NG")}</span>
                            </div>

                            <div className="flex justify-between text-slate-600">
                                <span>Service Fee</span>
                                <span>₦{serviceFee.toLocaleString("en-NG")}</span>
                            </div>
                        </div>

                        <div className="my-5 border-t border-slate-200" />

                        <div className="flex justify-between text-lg font-bold text-slate-900">
                            <span>Total to Pay</span>
                            <span>₦{orderTotal.toLocaleString("en-NG")}</span>
                        </div>

                        <button
                            type="button"
                            disabled
                            className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 px-6 py-3.5 font-semibold text-slate-600"
                        >
                            Pay with Paystack
                        </button>

                        <p className="mt-3 text-center text-xs text-slate-400">
                            Payment integration coming next
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
