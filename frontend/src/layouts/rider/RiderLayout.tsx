
import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  Bell,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    path: "/rider",
    icon: LayoutDashboard,
  },
  {
    name: "Delivery Requests",
    path: "/rider/requests",
    icon: Package,
  },
  {
    name: "My Deliveries",
    path: "/rider/deliveries",
    icon: Truck,
  },
  {
    name: "Earnings",
    path: "/rider/earnings",
    icon: Wallet,
  },
  {
    name: "My Profile",
    path: "/rider/profile",
    icon: User,
  },
];

export default function RiderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link to="/rider" className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500 p-2">
              <Truck size={23} />
            </div>
            <div>
              <p className="text-lg font-bold">CommerceHub</p>
              <p className="text-xs text-slate-400">Rider Portal</p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rider Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-400">
              R
            </div>
            <div>
              <p className="text-sm font-semibold">Demo Rider</p>
              <p className="text-xs text-slate-400">Delivery Partner</p>
            </div>
          </div>

          <Link
            to="/store"
            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            <LogOut size={18} />
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-900 lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Rider Portal
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your deliveries and earnings
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
