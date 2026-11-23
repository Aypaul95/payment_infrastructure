import {
  ArrowRight,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Food & Meals", emoji: "🍔", color: "bg-orange-50" },
  { name: "Groceries", emoji: "🥬", color: "bg-green-50" },
  { name: "Pharmacy", emoji: "💊", color: "bg-blue-50" },
  { name: "Fashion", emoji: "👕", color: "bg-purple-50" },
  { name: "Electronics", emoji: "📱", color: "bg-slate-100" },
  { name: "Beauty", emoji: "✨", color: "bg-pink-50" },
];

const vendors = [
  {
    name: "Mama's Kitchen",
    category: "African Food",
    rating: 4.8,
    delivery: "20–35 min",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Fresh Basket",
    category: "Groceries",
    rating: 4.7,
    delivery: "15–30 min",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "HealthPlus Store",
    category: "Pharmacy",
    rating: 4.9,
    delivery: "25–40 min",
    image:
      "https://images.unsplash.com/photo-1576614432340-4e6f9e0c6e3a?auto=format&fit=crop&w=800&q=80",
  },
];

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
  },
];

function StorePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            Your everyday shopping destination
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
            Everything you need,
            <br />
            delivered to your door.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-indigo-100 sm:text-base">
            Shop food, groceries, essentials and more from trusted
            local businesses around you.
          </p>

          <button
            type="button"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Start Shopping
            <ArrowRight size={17} />
          </button>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/50" />
        <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-indigo-400/30" />

        <div className="absolute bottom-8 right-10 hidden lg:block">
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white/10 text-8xl backdrop-blur-sm">
            🛍️
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: ShieldCheck,
            title: "Trusted Vendors",
            description: "Quality local businesses",
          },
          {
            icon: Truck,
            title: "Fast Delivery",
            description: "Delivered to your door",
          },
          {
            icon: Clock,
            title: "Convenient Shopping",
            description: "Shop anytime, anywhere",
          },
          {
            icon: ShoppingBag,
            title: "Easy Checkout",
            description: "Simple and secure payments",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Icon size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </section>
          {/* Categories */}
          <section>
              <div className="mb-5 flex items-center justify-between">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                          Shop by Category
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                          Find exactly what you're looking for.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {categories.map((category) => (
                      <button
                          key={category.name}
                          type="button"
                          className={`group rounded-2xl border border-slate-200 p-5 text-center transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md ${category.color}`}
                      >
                          <div className="text-4xl transition group-hover:scale-110">
                              {category.emoji}
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-800">
                              {category.name}
                          </p>
                      </button>
                  ))}
              </div>
          </section>
          {/* Featured Vendors */}
          <section>
              <div className="mb-5 flex items-end justify-between">
                  <div>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                          Featured Stores
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                          Discover trusted businesses around you.
                      </p>
                  </div>

                  <button
                      type="button"
                      className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                      View all
                      <ArrowRight size={16} />
                  </button>
              </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {vendors.map((vendor) => (
                        <div
                            key={vendor.name}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={vendor.image}
                                    alt={vendor.name}
                                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                                />

                                <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
                                    {vendor.delivery}
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900">
                                            {vendor.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {vendor.category}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                        {vendor.rating}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                    Visit Store
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {/* Popular Products */}
            <section>
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                            Popular Products
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Products customers love.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        View all
                        <ArrowRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <Link to={`/store/product/${product.id}`}>
                                <div className="relative aspect-square overflow-hidden bg-slate-100">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                                    />

                                    {product.tag && (
                                        <span className="absolute left-3 top-3 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                                            {product.tag}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <div className="p-3 sm:p-4">
                                <p className="truncate text-xs text-slate-500">
                                    {product.vendor}
                                </p>

                                <Link to={`/store/product/${product.id}`}>
                                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 hover:text-indigo-600">
                                        {product.name}
                                    </h3>
                                </Link>

                                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                                    <Star
                                        size={13}
                                        className="fill-amber-400 text-amber-400"
                                    />
                                    <span className="font-semibold">
                                        {product.rating}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <p className="text-sm font-bold text-slate-900 sm:text-base">
                                        ₦{product.price.toLocaleString("en-NG")}
                                    </p>

                                    <button
                                        type="button"
                                        className="rounded-lg bg-indigo-600 p-2 text-white transition hover:bg-indigo-700"
                                        aria-label={`Add ${product.name} to cart`}
                                    >
                                        <ShoppingBag size={17} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default StorePage;