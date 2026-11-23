
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Settings,
  Store,
  ChevronLeft,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Products", icon: Package, path: "/products" },
      { label: "Inventory", icon: Warehouse, path: "/inventory" },
      { label: "Orders", icon: ShoppingCart, path: "/orders" },
      { label: "Customers", icon: Users, path: "/customers" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Deliveries", icon: Truck, path: "/deliveries" },
      { label: "Payments", icon: CreditCard, path: "/payments" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Store size={22} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900">
                  CommerceHub
                </h1>
                <p className="text-xs text-slate-500">
                  Business Portal
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {navigation.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-slate-400">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                      <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === "/dashboard"}
                          onClick={onClose}
                          title={collapsed ? item.label : undefined}
                          className={({ isActive }) =>
                              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`
                          }
                      >
                          <Icon size={19} className="shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-slate-100 p-3">
                  <NavLink
                      to="/settings"
                      onClick={onClose}
                      className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`
                      }
                      title={collapsed ? "Settings" : undefined}
                  >
                      <Settings size={19} />
                      {!collapsed && <span>Settings</span>}
                  </NavLink>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
