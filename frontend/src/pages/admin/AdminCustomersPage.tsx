
import { useMemo, useState } from 'react';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Wallet,
} from 'lucide-react';

type CustomerStatus = 'Active' | 'Suspended';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joined: string;
  status: CustomerStatus;
  orders: number;
  totalSpent: string;
};

const initialCustomers: Customer[] = [
  {
    id: 'CUS-1001',
    name: 'Michael Johnson',
    email: 'michael@example.com',
    phone: '+234 801 234 5678',
    location: 'Tanke, Ilorin',
    joined: '12 Oct 2026',
    status: 'Active',
    orders: 24,
    totalSpent: '₦285,500',
  },
  {
    id: 'CUS-1002',
    name: 'Grace Williams',
    email: 'grace@example.com',
    phone: '+234 802 345 6789',
    location: 'Fate, Ilorin',
    joined: '15 Oct 2026',
    status: 'Active',
    orders: 18,
    totalSpent: '₦194,000',
  },
  {
    id: 'CUS-1003',
    name: 'David James',
    email: 'david@example.com',
    phone: '+234 803 456 7890',
    location: 'Unity Road, Ilorin',
    joined: '22 Oct 2026',
    status: 'Active',
    orders: 12,
    totalSpent: '₦126,800',
  },
  {
    id: 'CUS-1004',
    name: 'Mary Adams',
    email: 'mary@example.com',
    phone: '+234 804 567 8901',
    location: 'GRA, Ilorin',
    joined: '28 Oct 2026',
    status: 'Suspended',
    orders: 8,
    totalSpent: '₦78,500',
  },
  {
    id: 'CUS-1005',
    name: 'Samuel Peter',
    email: 'samuel@example.com',
    phone: '+234 805 678 9012',
    location: 'Post Office, Ilorin',
    joined: '03 Nov 2026',
    status: 'Active',
    orders: 31,
    totalSpent: '₦412,000',
  },
  {
    id: 'CUS-1006',
    name: 'Aisha Ibrahim',
    email: 'aisha@example.com',
    phone: '+234 806 789 0123',
    location: 'Sango, Ilorin',
    joined: '10 Nov 2026',
    status: 'Active',
    orders: 5,
    totalSpent: '₦42,500',
  },
];

const statusStyles: Record<CustomerStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Suspended: 'bg-red-100 text-red-700',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        customer.name.toLowerCase().includes(searchText) ||
        customer.email.toLowerCase().includes(searchText) ||
        customer.id.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === 'All' || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const updateStatus = (id: string, status: CustomerStatus) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id ? { ...customer, status } : customer,
      ),
    );

    setSelectedCustomer((current) =>
      current?.id === id ? { ...current, status } : current,
    );
  };

  const activeCount = customers.filter(
    (customer) => customer.status === 'Active',
  ).length;

  const suspendedCount = customers.filter(
    (customer) => customer.status === 'Suspended',
  ).length;

  const totalOrders = customers.reduce(
    (total, customer) => total + customer.orders,
    0,
  );

  const closeDetails = () => setSelectedCustomer(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customers Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage customers registered on your platform.
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
              <Users size={21} />
            </div>
            <p className="text-sm text-slate-500">Total Customers</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {customers.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <UserCheck size={21} />
            </div>
            <p className="text-sm text-slate-500">Active Customers</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {activeCount}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <UserX size={21} />
            </div>
            <p className="text-sm text-slate-500">Suspended Customers</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {suspendedCount}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {totalOrders} total orders across all customers
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Registered Customers</h2>
            <p className="mt-1 text-xs text-slate-500">
              Search and filter customer accounts.
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
                placeholder="Search customers..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Contact</th>
                <th className="px-5 py-4 font-semibold">Orders</th>
                <th className="px-5 py-4 font-semibold">Total Spent</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {customer.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {customer.id}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{customer.email}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {customer.phone}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {customer.orders}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {customer.totalSpent}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[customer.status]}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </section>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="customer-details-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {selectedCustomer.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCustomer.id}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selectedCustomer.status]}`}
              >
                {selectedCustomer.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={17} />
                {selectedCustomer.email}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={17} />
                {selectedCustomer.phone}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={17} />
                {selectedCustomer.location}
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShoppingBag size={14} />
                    Total orders
                  </div>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedCustomer.orders}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Wallet size={14} />
                    Total spent
                  </div>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedCustomer.totalSpent}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Joined platform</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedCustomer.joined}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {selectedCustomer.status === 'Suspended' ? (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(selectedCustomer.id, 'Active')
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <CheckCircle2 size={16} />
                  Activate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updateStatus(selectedCustomer.id, 'Suspended')
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
              Demo only: account status changes are temporary and are not saved to the backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
