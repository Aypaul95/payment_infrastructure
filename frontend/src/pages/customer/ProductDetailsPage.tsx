import { useState } from "react";

import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Star,
    ShoppingBag,
    Minus,
    Plus,
    Truck,
    ShieldCheck,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

const products = [
    {
        id: 1,
        name: "Jollof Rice & Chicken",
        vendor: "Mama's Kitchen",
        price: 4500,
        rating: 4.8,
        image:
            "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80",
        tag: "Popular",
        description:
            "Delicious Nigerian-style jollof rice served with juicy grilled chicken. Freshly prepared with rich spices and authentic flavor.",
    },
    {
        id: 2,
        name: "Fresh Tomatoes",
        vendor: "Fresh Basket",
        price: 1800,
        rating: 4.6,
        image:
            "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=80",
        tag: "Fresh",
        description:
            "Fresh, ripe tomatoes perfect for soups, stews, sauces, and everyday cooking.",
    },
    {
        id: 3,
        name: "Premium Bread",
        vendor: "Daily Bakery",
        price: 1500,
        rating: 4.7,
        image:
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        tag: "",
        description:
            "Soft, freshly baked bread with a delicious taste, perfect for breakfast or snacks.",
    },
    {
        id: 4,
        name: "Natural Fruit Juice",
        vendor: "Fresh Sip",
        price: 2500,
        rating: 4.5,
        image:
            "https://images.unsplash.com/photo-1613478223719-2b7d1a9a2e3b?auto=format&fit=crop&w=800&q=80",
        tag: "Healthy",
        description:
            "Refreshing fruit juice made for a delicious and satisfying drink throughout your day.",
    },
];
function ProductDetailsPage() {
    const { productId } = useParams();
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    const product = products.find(
        (item) => item.id === Number(productId)
    );

    if (!product) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                    Product Not Found
                </h2>

                <p className="mt-2 text-slate-500">
                    Sorry, this product does not exist or is no longer available.
                </p>

                <Link
                    to="/store"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <ArrowLeft size={17} />
                    Back to Store
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Navigation */}
            <Link
                to="/store"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
            >
                <ArrowLeft size={18} />
                Back to Store
            </Link>

            {/* Product Image */}
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="overflow-hidden rounded-3xl bg-slate-100">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full max-h-[550px] w-full object-cover"
                    />
                </div>
            </div>

            <div className="flex flex-col justify-center">
                {product.tag && (
                    <span className="w-fit rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {product.tag}
                    </span>
                )}

                <p className="mt-4 text-sm font-medium text-slate-500">
                    {product.vendor}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                    {product.name}
                </h1>

                <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star size={18} className="fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{product.rating}</span>
                    </div>

                    <span className="text-sm text-slate-400">
                        Customer rating
                    </span>
                </div>

                <div className="mt-6">
                    <p className="text-3xl font-bold text-slate-900">
                        ₦{(product.price * quantity).toLocaleString("en-NG")}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                        ₦{product.price.toLocaleString("en-NG")} per item
                    </p>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                    {product.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                    <Truck size={18} className="text-indigo-600" />
                    Delivery available at checkout
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <ShieldCheck size={18} className="text-indigo-600" />
                    Secure payment
                </div>
                {/* Quantity Selector */}
                <div className="mt-8">
                    <p className="mb-3 text-sm font-semibold text-slate-700">
                        Quantity
                    </p>

                    <div className="flex w-fit items-center gap-5 rounded-xl border border-slate-200 p-2">
                        <button
                            type="button"
                            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                            className="rounded-lg p-2 transition hover:bg-slate-100"
                        >
                            <Minus size={18} />
                        </button>

                        <span className="min-w-5 text-center font-semibold">
                            {quantity}
                        </span>

                        <button
                            type="button"
                            onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                            className="rounded-lg p-2 transition hover:bg-slate-100"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
                {/* Add to Cart Button */}
                <button
                    type="button"
                    onClick={() =>
                        addToCart(
                            {
                                id: product.id,
                                name: product.name,
                                vendor: product.vendor,
                                price: product.price,
                                image: product.image,
                            },
                            quantity,
                        )
                    }
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 sm:w-fit"
                >
                    <ShoppingBag size={20} />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

export default ProductDetailsPage;