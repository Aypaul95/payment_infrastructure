
import { useMemo, useState } from "react";
import {
  Search,
  Bike,
  Users,
  CheckCircle,
  Clock,
  Ban,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Check,
  ShieldCheck,
} from "lucide-react";

type RiderStatus = "Active" | "Pending" | "Suspended";

type Rider = {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  registration: string;
  location: string;
  status: RiderStatus;
  deliveries: number;
  joined: string;
};

const initialRiders: Rider[] = [
  {
    id: "RID-1001",
    name: "James Okafor",
    email: "james.okafor@example.com",
    phone: "+234 801 234 5678",
    vehicle: "Motorcycle",
    registration: "KW-123-ABC",
    location: "Ilorin, Kwara",
    status: "Active",
    deliveries: 142,
    joined: "Jan 12, 2026",
  },
  {
    id: "RID-1002",
    name: "Ibrahim Musa",
    email: "ibrahim.musa@example.com",
    phone: "+234 802 345 6789",
    vehicle: "Motorcycle",
    registration: "KW-456-DEF",
    location: "Ilorin, Kwara",
    status: "Pending",
    deliveries: 0,
    joined: "Nov 18, 2026",
  },
  {
    id: "RID-1003",
    name: "David Williams",
    email: "david.williams@example.com",
    phone: "+234 803 456 7890",
    vehicle: "Bicycle",
    registration: "N/A",
    location: "Lagos, Lagos",
    status: "Active",
    deliveries: 86,
    joined: "Mar 5, 2026",
  },
  {
    id: "RID-1004",
    name: "Samuel Adeyemi",
    email: "samuel.adeyemi@example.com",
    phone: "+234 804 567 8901",
    vehicle: "Motorcycle",
    registration: "KW-789-GHI",
    location: "Offa, Kwara",
    status: "Suspended",
    deliveries: 54,
    joined: "Feb 20, 2026",
  },
  {
    id: "RID-1005",
    name: "Aisha Bello",
    email: "aisha.bello@example.com",
    phone: "+234 805 678 9012",
    vehicle: "Motorcycle",
    registration: "KW-321-JKL",
    location: "Ilorin, Kwara",
    status: "Active",
    deliveries: 203,
    joined: "Dec 8, 2025",
  },
  {
    id: "RID-1006",
    name: "Peter Johnson",
    email: "peter.johnson@example.com",
    phone: "+234 806 789 0123",
    vehicle: "Tricycle",
    registration: "KW-654-MNO",
    location: "Ibadan, Oyo",
    status: "Pending",
    deliveries: 0,
    joined: "Nov 20, 2026",
  },
];

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>(initialRiders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const stats = {
    total: riders.length,
    active: riders.filter((rider) => rider.status === "Active").length,
    pending: riders.filter((rider) => rider.status === "Pending").length,
    suspended: riders.filter((rider) => rider.status === "Suspended").length,
  };

  const filteredRiders = useMemo(() => {
    const query = search.toLowerCase();

    return riders.filter((rider) => {
      const matchesSearch =
        rider.name.toLowerCase().includes(query) ||
        rider.email.toLowerCase().includes(query) ||
        rider.phone.toLowerCase().includes(query) ||
        rider.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || rider.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [riders, search, statusFilter]);

  const updateStatus = (id: string, status: RiderStatus) => {
    setRiders((current) =>
      current.map((rider) =>
        rider.id === id ? { ...rider, status } : rider
      )
    );

    setSelectedRider((current) =>
      current?.id === id ? { ...current, status } : current
    );
  };

  const statusStyle = (status: RiderStatus) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Suspended":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Riders Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage rider registrations, approvals and account status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Riders</p>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Riders</p>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.active}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Suspended Riders</p>
            <Ban className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.suspended}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Registered Riders</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage delivery rider accounts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search riders..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Rider</th>
                <th className="px-5 py-3 font-medium">Rider ID</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Deliveries</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRiders.map((rider) => (
                <tr key={rider.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{rider.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{rider.email}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{rider.id}</td>
                  <td className="px-5 py-4 text-gray-600">{rider.vehicle}</td>
                  <td className="px-5 py-4 text-gray-600">{rider.deliveries}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(rider.status)}`}>
                      {rider.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedRider(rider)}
                        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
                        title="View rider"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {rider.status === "Pending" && (
                        <button
                          onClick={() => updateStatus(rider.id, "Active")}
                          className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          Approve
                        </button>
                      )}

                      {rider.status === "Active" && (
                        <button
                          onClick={() => updateStatus(rider.id, "Suspended")}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Suspend
                        </button>
                      )}

                      {rider.status === "Suspended" && (
                        <button
                          onClick={() => updateStatus(rider.id, "Active")}
                          className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No riders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
          Showing {filteredRiders.length} of {riders.length} riders
        </div>
      </div>

      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="font-semibold text-gray-900">Rider Details</h2>
                <p className="mt-1 text-xs text-gray-500">{selectedRider.id}</p>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Bike className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedRider.name}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(selectedRider.status)}`}>
                    {selectedRider.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{selectedRider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedRider.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bike className="h-4 w-4 text-gray-400" />
                  <span>{selectedRider.vehicle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <span>{selectedRider.registration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedRider.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {selectedRider.joined}</span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Completed Deliveries</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedRider.deliveries}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {selectedRider.status === "Pending" && (
                  <button
                    onClick={() => updateStatus(selectedRider.id, "Active")}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Approve Rider
                  </button>
                )}

                {selectedRider.status === "Active" && (
                  <button
                    onClick={() => updateStatus(selectedRider.id, "Suspended")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Suspend Rider
                  </button>
                )}

                {selectedRider.status === "Suspended" && (
                  <button
                    onClick={() => updateStatus(selectedRider.id, "Active")}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Reactivate Rider
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Demo data</p>
        <p className="mt-1">
          Rider records and status changes are stored only in frontend state.
          No real rider accounts are modified.
        </p>
      </div>
    </div>
  );
}
