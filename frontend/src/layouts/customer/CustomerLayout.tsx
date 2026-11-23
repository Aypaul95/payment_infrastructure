import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  User,
  Menu,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

interface CustomerLayoutProps {
  children: ReactNode;
}

function CustomerLayout({ children }: CustomerLayoutProps) {
    const { cartCount } = useCart();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/store" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ShoppingBag size={21} />
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-900">
              CommerceHub
            </span>
          </Link>

          {/* Search */}
          <div className="mx-6 hidden max-w-xl flex-1 md:block">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <Search size={18} className="text-slate-400" />

              <input
                type="search"
                placeholder="Search products, stores..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/store/cart"
              className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={21} />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </Link>

            <Link
              to="/store/profile"
              className="hidden items-center gap-2 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 sm:flex"
            >
              <User size={19} />
              <span className="text-sm font-medium">Account</span>
            </Link>

            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile search */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search size={17} className="text-slate-400" />

          <input
            type="search"
            placeholder="Search products, stores..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} CommerceHub. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link to="/store" className="hover:text-indigo-600">
              Shop
            </Link>
            <Link to="/store/orders" className="hover:text-indigo-600">
              My Orders
            </Link>
            <Link to="/store/profile" className="hover:text-indigo-600">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;