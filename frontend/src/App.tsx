
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import ProductsPage from "./components/dashboard/ProductsPage";
import InventoryPage from "./components/dashboard/InventoryPage";
import OrdersPage from "./components/dashboard/OrdersPage";
import CustomersPage from "./components/dashboard/CustomersPage";
import DeliveriesPage from "./components/dashboard/DeliveriesPage";
import PaymentsPage from "./components/dashboard/PaymentsPage";
import SettingsPage from "./components/dashboard/SettingsPage";

import CustomerLayout from "./layouts/customer/CustomerLayout";
import StorePage from "./pages/customer/StorePage";
import ProductDetailsPage from "./pages/customer/ProductDetailsPage";
import { CartProvider } from "./context/CartContext";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import PaymentPage from "./pages/customer/PaymentPage";
import OrderTrackingPage from "./pages/customer/OrderTrackingPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";

import RiderLayout from "./layouts/rider/RiderLayout";
import RiderDashboardPage from "./pages/rider/RiderDashboardPage";
import DeliveryRequestsPage from "./pages/rider/DeliveryRequestsPage";
import MyDeliveriesPage from "./pages/rider/MyDeliveriesPage";
import RiderEarningsPage from "./pages/rider/RiderEarningsPage";
import RiderProfilePage from "./pages/rider/RiderProfilePage";

import AdminLayout from "./layouts/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import BusinessesPage from "./pages/admin/BusinessesPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminRidersPage from "./pages/admin/AdminRidersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminDeliveriesPage from "./pages/admin/AdminDeliveriesPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      <p className="mt-2 text-sm text-slate-500">
        This section is under development. Its functionality will be
        implemented in a later development step.
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Business Dashboard */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            element={
              <DashboardLayout>
                <></>
              </DashboardLayout>
            }
          >
            <Route
              path="/dashboard"
              element={<DashboardOverview />}
            />

            <Route
              path="/products"
              element={<ProductsPage />}
            />

            <Route
              path="/inventory"
              element={<InventoryPage />}
            />

            <Route
              path="/orders"
              element={<OrdersPage />}
            />

            <Route
              path="/customers"
              element={<CustomersPage />}
            />

            <Route
              path="/deliveries"
              element={<DeliveriesPage />}
            />

            <Route
              path="/payments"
              element={<PaymentsPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />
          </Route>

          {/* Customer App */}
          <Route
            path="/store"
            element={
              <CustomerLayout>
                <StorePage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/product/:productId"
            element={
              <CustomerLayout>
                <ProductDetailsPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/cart"
            element={
              <CustomerLayout>
                <CartPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/checkout"
            element={
              <CustomerLayout>
                <CheckoutPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/payment"
            element={
              <CustomerLayout>
                <PaymentPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/orders"
            element={
              <CustomerLayout>
                <OrderHistoryPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/orders/:orderId"
            element={
              <CustomerLayout>
                <OrderTrackingPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/store/profile"
            element={
              <CustomerLayout>
                <CustomerProfilePage />
              </CustomerLayout>
            }
          />

          {/* Rider PWA */}
          <Route element={<RiderLayout />}>
            <Route
              path="/rider"
              element={<RiderDashboardPage />}
            />

            <Route
              path="/rider/requests"
              element={<DeliveryRequestsPage />}
            />

            <Route
              path="/rider/deliveries"
              element={<MyDeliveriesPage />}
            />

            <Route
              path="/rider/earnings"
              element={<RiderEarningsPage />}
            />

            <Route
              path="/rider/profile"
              element={<RiderProfilePage />}
            />
          </Route>

          {/* Admin Dashboard */}
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<AdminDashboardPage />}
            />

            <Route
              path="/admin/businesses"
              element={<BusinessesPage />}
            />

            <Route
              path="/admin/customers"
              element={<AdminCustomersPage />}
            />

            <Route
              path="/admin/riders"
              element={<AdminRidersPage />}
            />

            <Route
              path="/admin/orders"
              element={<AdminOrdersPage />}
            />

            <Route
              path="/admin/deliveries"
              element={<AdminDeliveriesPage />}
            />

            <Route
              path="/admin/payments"
              element={<AdminPaymentsPage />}
            />

            <Route
              path="/admin/settings"
              element={<AdminSettingsPage />}
            />
          </Route>

          {/* Not Found */}
          <Route
            path="*"
            element={<PlaceholderPage title="Page Not Found" />}
          />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
