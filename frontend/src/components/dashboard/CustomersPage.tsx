
import { useMemo, useState } from "react";
import {
  Search,
  Users,
  UserPlus,
  Repeat,
  Wallet,
  ShoppingBag,
  X,
} from "lucide-react";

type OrderStatus =
  | "Pending Payment"
  | "Paid"
  | "Confirmed"
  | "Processing"
  | "Ready for Delivery"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  orders: CustomerOrder[];
};

const sampleOrders = [
  {
    id: "1",
    orderNumber: "ORD-2026-001",
    customerName: "Amina Yusuf",
    customerPhone: "08012345678",
    customerEmail: "amina@example.com",
    total: 113500,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Confirmed" as OrderStatus,
    deliveryAddress: "GRA, Ilorin, Kwara State",
    createdAt: "2026-11-20T08:15:00",
  },
  {
    id: "2",
    orderNumber: "ORD-2026-002",
    customerName: "David Okafor",
    customerPhone: "08023456789",
    customerEmail: "david@example.com",
    total: 51800,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Processing" as OrderStatus,
    deliveryAddress: "Tanke, Ilorin, Kwara State",
    createdAt: "2026-11-20T07:45:00",
  },
  {
    id: "3",
    orderNumber: "ORD-2026-003",
    customerName: "Fatima Ibrahim",
    customerPhone: "08034567890",
    customerEmail: "fatima@example.com",
    total: 33000,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Ready for Delivery" as OrderStatus,
    deliveryAddress: "Unity Road, Ilorin, Kwara State",
    createdAt: "2026-11-20T07:20:00",
  },
  {
    id: "4",
    orderNumber: "ORD-2026-004",
    customerName: "Samuel Ade",
    customerPhone: "08045678901",
    customerEmail: "samuel@example.com",
    total: 174500,
    paymentStatus: "Pending" as PaymentStatus,
    status: "Pending Payment" as OrderStatus,
    deliveryAddress: "Fate Road, Ilorin, Kwara State",
    createdAt: "2026-11-20T06:50:00",
  },
  {
    id: "5",
    orderNumber: "ORD-2026-005",
    customerName: "Grace Eze",
    customerPhone: "08056789012",
    customerEmail: "grace@example.com",
    total: 52500,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Out for Delivery" as OrderStatus,
    deliveryAddress: "Sango, Ilorin, Kwara State",
    createdAt: "2026-11-20T06:25:00",
  },
  {
    id: "6",
    orderNumber: "ORD-2026-006",
    customerName: "Michael Bello",
    customerPhone: "08067890123",
    customerEmail: "michael@example.com",
    total: 18500,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Delivered" as OrderStatus,
    deliveryAddress: "Offa Garage, Ilorin, Kwara State",
    createdAt: "2026-11-19T18:30:00",
  },
  {
    id: "7",
    orderNumber: "ORD-2026-007",
    customerName: "Blessing James",
    customerPhone: "08078901234",
    customerEmail: "blessing@example.com",
    total: 25000,
    paymentStatus: "Paid" as PaymentStatus,
    status: "Cancelled" as OrderStatus,
    deliveryAddress: "Oke-Odo, Ilorin, Kwara State",
    createdAt: "2026-11-19T16:15:00",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const grouped = new Map<string, Customer>();

    sampleOrders.forEach((order) => {
      const existing = grouped.get(order.customerPhone);

      const customerOrder: CustomerOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
      };

      if (existing) {
        existing.orders.push(customerOrder);
      } else {
        grouped.set(order.customerPhone, {
          id: order.customerPhone,
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail,
          address: order.deliveryAddress,
          orders: [customerOrder],
        });
      }
    });

    return Array.from(grouped.values());
  });

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const customerStats = useMemo(() => {
    const totalCustomers = customers.length;

    const repeatCustomers = customers.filter(
      (customer) => customer.orders.length > 1
    ).length;

    const newCustomers = customers.filter(
      (customer) => customer.orders.length === 1
    ).length;

    const totalRevenue = customers.reduce(
      (total, customer) =>
        total +
        customer.orders
          .filter((order) => order.paymentStatus === "Paid")
          .reduce((sum, order) => sum + order.total, 0),
      0
    );

    return {
      totalCustomers,
      repeatCustomers,
      newCustomers,
      totalRevenue,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email.toLowerCase().includes(query)
    );
  }, [customers, search]);

  const getCustomerSpending = (customer: Customer) =>
    customer.orders
      .filter((order) => order.paymentStatus === "Paid")
      .reduce((total, order) => total + order.total, 0);

  const getCustomerStatus = (customer: Customer) =>
    customer.orders.length > 1 ? "Repeat Customer" : "New Customer";

  const getStatusStyle = (status: OrderStatus) => {
    if (status === "Delivered") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Cancelled") {
      return "bg-red-100 text-red-700";
    }

    if (status === "Pending Payment") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  const handleCustomerUpdate = (
    customerId: string,
    updatedAddress: string
  ) => {
    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === customerId
          ? { ...customer, address: updatedAddress }
          : customer
      )
    );

    setSelectedCustomer((previous) =>
      previous?.id === customerId
        ? { ...previous, address: updatedAddress }
        : previous
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Customers
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage customer information, relationships and purchase history.
        </p>
      </div>

      {/* Demonstration Data Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800">
          Demonstration data
        </p>

        <p className="mt-1 text-xs text-amber-700">
          Customer records are generated from sample orders and stored
          in temporary frontend state. Backend integration will follow.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Customers</p>
            <Users className="text-blue-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {customerStats.totalCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">New Customers</p>
            <UserPlus className="text-indigo-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {customerStats.newCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Repeat Customers</p>
            <Repeat className="text-green-600" size={21} />
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {customerStats.repeatCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Customer Revenue</p>
            <Wallet className="text-purple-600" size={21} />
          </div>

          <p className="mt-3 text-xl font-bold text-slate-900">
            {formatCurrency(customerStats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer name, phone number or email..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Customer Directory */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {filteredCustomers.length} customers found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Orders</th>
                <th className="px-5 py-4">Total Spending</th>
                <th className="px-5 py-4">Customer Type</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-900">
                        {customer.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.address}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {customer.phone}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {customer.orders.length}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(getCustomerSpending(customer))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          customer.orders.length > 1
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getCustomerStatus(customer)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Customer Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedCustomer.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close customer details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-slate-900">
                  Contact Information
                </h3>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedCustomer.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Phone Number</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedCustomer.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Email Address</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedCustomer.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Delivery Address</p>
                    <input
                      type="text"
                      value={selectedCustomer.address}
                      onChange={(event) =>
                        handleCustomerUpdate(
                          selectedCustomer.id,
                          event.target.value
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <ShoppingBag className="text-blue-600" size={20} />

                  <p className="mt-3 text-xs text-slate-500">
                    Total Orders
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedCustomer.orders.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Wallet className="text-green-600" size={20} />

                  <p className="mt-3 text-xs text-slate-500">
                    Total Spending
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(getCustomerSpending(selectedCustomer))}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Users className="text-purple-600" size={20} />

                  <p className="mt-3 text-xs text-slate-500">
                    Customer Type
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {getCustomerStatus(selectedCustomer)}
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-semibold text-slate-900">
                  Order History
                </h3>

                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomer.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                            {order.orderNumber}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                            {formatCurrency(order.total)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
