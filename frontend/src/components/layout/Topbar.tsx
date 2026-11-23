
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            Business Portal / Overview
          </p>
          <h2 className="truncate text-lg font-bold text-slate-900">
            Dashboard
          </h2>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-3 sm:gap-5">
        <div className="hidden w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:flex">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            aria-label="Search dashboard"
          />
          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            /
          </span>
        </div>

        <button
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            B
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Business Owner
            </p>
            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
