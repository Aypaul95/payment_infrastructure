
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

        {/* Other Customer App Pages */}
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
