
import { useMemo, useState } from 'react';
import {
  Search,
  Store,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

type BusinessStatus = 'Approved' | 'Pending' | 'Suspended';

type Business = {
  id: string;
  name: string;
  owner: string;
  category: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  status: BusinessStatus;
  orders: number;
  revenue: string;
};

const initialBusinesses: Business[] = [
  {
    id: 'BUS-1001',
    name: "Mama's Kitchen",
    owner: 'Amina Yusuf',
    category: 'Restaurant',
    email: 'mama@example.com',
    phone: '+234 801 234 5678',
    location: 'Tanke, Ilorin',
    joined: '12 Oct 2026',
    status: 'Approved',
    orders: 248,
    revenue: '₦2,450,000',
  },
  {
    id: 'BUS-1002',
    name: 'Fresh Basket',
    owner: 'Daniel Okafor',
    category: 'Groceries',
    email: 'fresh@example.com',
    phone: '+234 802 345 6789',
    location: 'Fate, Ilorin',
    joined: '18 Oct 2026',
    status: 'Approved',
    orders: 186,
    revenue: '₦1,850,000',
  },
  {
    id: 'BUS-1003',
    name: 'HealthPlus Store',
    owner: 'Grace Adeyemi',
    category: 'Pharmacy',
    email: 'health@example.com',
    phone: '+234 803 456 7890',
    location: 'Post Office, Ilorin',
    joined: '02 Nov 2026',
    status: 'Pending',
    orders: 0,
    revenue: '₦0',
  },
  {
    id: 'BUS-1004',
    name: 'Mama Foods',
    owner: 'Mary Johnson',
    category: 'Restaurant',
    email: 'foods@example.com',
    phone: '+234 804 567 8901',
    location: 'Unity Road, Ilorin',
    joined: '05 Nov 2026',
    status: 'Approved',
    orders: 124,
    revenue: '₦980,000',
  },
  {
    id: 'BUS-1005',
    name: 'City Pharmacy',
    owner: 'Samuel Ibrahim',
    category: 'Pharmacy',
    email: 'city@example.com',
    phone: '+234 805 678 9012',
    location: 'GRA, Ilorin',
    joined: '09 Nov 2026',
    status: 'Suspended',
    orders: 42,
    revenue: '₦320,000',
  },
  {
    id: 'BUS-1006',
    name: 'Daily Needs Market',
    owner: 'Peter James',
    category: 'Groceries',
    email: 'daily@example.com',
    phone: '+234 806 789 0123',
    location: 'Sango, Ilorin',
    joined: '15 Nov 2026',
    status: 'Pending',
    orders: 0,
    revenue: '₦0',
  },
];

const statusStyles: Record<BusinessStatus, string> = {
  Approved: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Suspended: 'bg-red-100 text-red-700',
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        business.name.toLowerCase().includes(searchText) ||
        business.owner.toLowerCase().includes(searchText) ||
        business.id.toLowerCase().includes(searchText) ||
        business.category.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === 'All' || business.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, statusFilter]);

  const updateStatus = (id: string, status: BusinessStatus) => {
    setBusinesses((current) =>
      current.map((business) =>
        business.id === id ? { ...business, status } : business,
      ),
    );

    setSelectedBusiness((current) =>
      current?.id === id ? { ...current, status } : current,
    );
  };

  const approvedCount = businesses.filter(
    (business) => business.status === 'Approved',
  ).length;

  const pendingCount = businesses.filter(
    (business) => business.status === 'Pending',
  ).length;

  const suspendedCount = businesses.filter(
    (business) => business.status === 'Suspended',
  ).length;

  const closeDetails = () => setSelectedBusiness(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Businesses Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage businesses registered on your platform.
          </p>
        </div>

        <span className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
          Demo data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Store size={21} />
            </div>
            <p className="text-sm text-slate-500">Total Businesses</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {businesses.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={21} />
            </div>
            <p className="text-sm text-slate-500">Approved</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {approvedCount}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock size={21} />
            </div>
            <p className="text-sm text-slate-500">Pending Review</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {pendingCount}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {suspendedCount} suspended
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Registered Businesses</h2>
            <p className="mt-1 text-xs text-slate-500">
              Search and filter platform businesses.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search businesses..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">All statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Business</th>
                <th className="px-5 py-4 font-semibold">Owner</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Orders</th>
                <th className="px-5 py-4 font-semibold">Revenue</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {business.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {business.id}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {business.owner}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {business.category}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {business.orders}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {business.revenue}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[business.status]}`}
                    >
                      {business.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedBusiness(business)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredBusinesses.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No businesses match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </div>
      </section>

      {selectedBusiness && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="business-details-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {selectedBusiness.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedBusiness.id}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selectedBusiness.status]}`}
              >
                {selectedBusiness.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Business owner</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedBusiness.owner}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={17} />
                {selectedBusiness.email}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={17} />
                {selectedBusiness.phone}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={17} />
                {selectedBusiness.location}
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">Total orders</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedBusiness.orders}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Revenue</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedBusiness.revenue}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBusiness.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBusiness.joined}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {selectedBusiness.status !== 'Approved' && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(selectedBusiness.id, 'Approved')
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
              )}

              {selectedBusiness.status !== 'Suspended' && (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(selectedBusiness.id, 'Suspended')
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <XCircle size={16} />
                  Suspend
                </button>
              )}

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Demo only: status changes are temporary and are not saved to the backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
