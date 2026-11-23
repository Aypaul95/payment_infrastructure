
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
} from "lucide-react";

import { useCart } from "../../context/CartContext";

function CartPage() {
    const {
        items,
        cartTotal,
        updateQuantity,
        removeFromCart,
    } = useCart();

    return (
        <div className="space-y-8">
            {/* Page Heading */}
            <div>
                <Link
                    to="/store"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                    <ArrowLeft size={17} />
                    Continue Shopping
                </Link>

                <div className="mt-5">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Shopping Cart
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Review your selected products before checkout.
                    </p>
                </div>
            </div>

            {/* Cart Content */}
            {items.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <ShoppingBag size={30} />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-slate-900">
                        Your cart is empty
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        You haven't added any products yet.
                    </p>

                    <Link
                        to="/store"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="space-y-4 lg:col-span-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
                                >
                                    {/* Product Image */}
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-32 w-full rounded-xl object-cover sm:w-32"
                                    />

                                    {/* Product Information */}
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500">
                                                {item.vendor}
                                            </p>

                                            <h3 className="mt-1 font-bold text-slate-900">
                                                {item.name}
                                            </h3>

                                            <p className="mt-2 font-semibold text-indigo-600">
                                                ₦{item.price.toLocaleString("en-NG")}
                                            </p>
                                        </div>

                                        {/* Quantity and Remove */}
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(item.id, item.quantity - 1)
                                                    }
                                                    className="rounded-lg p-2 transition hover:bg-slate-100"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus size={16} />
                                                </button>

                                                <span className="min-w-5 text-center text-sm font-semibold">
                                                    {item.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(item.id, item.quantity + 1)
                                                    }
                                                    className="rounded-lg p-2 transition hover:bg-slate-100"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                className="flex items-center gap-2 text-sm font-medium text-red-500 transition hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item Total */}
                                    <div className="sm:text-right">
                                        <p className="text-xs text-slate-500">Item Total</p>

                                        <p className="mt-1 font-bold text-slate-900">
                                            ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Order Summary */}
                    <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900">
                            Order Summary
                        </h2>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Subtotal
                            </span>

                            <span className="font-semibold text-slate-900">
                                ₦{cartTotal.toLocaleString("en-NG")}
                            </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Delivery Fee
                            </span>

                            <span className="text-sm text-slate-500">
                                Calculated at checkout
                            </span>
                        </div>

                        <div className="my-6 border-t border-slate-200" />

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                                Subtotal
                            </span>

                            <span className="text-xl font-bold text-indigo-600">
                                ₦{cartTotal.toLocaleString("en-NG")}
                            </span>
                        </div>

                            <Link
                                to="/store/checkout"
                                className="mt-6 block w-full rounded-xl bg-blue-600 px-6 py-3.5 text-center font-semibold text-white transition hover:bg-blue-700"
                            >
                                Proceed to Checkout
                            </Link>

                        <p className="mt-3 text-center text-xs text-slate-400">
                            Checkout will be enabled in a later step.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
