
import { useState } from "react";
import {
  Save,
  Globe,
  DollarSign,
  Truck,
  Bell,
  Shield,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState("Payment Infrastructure");
  const [supportEmail, setSupportEmail] = useState("support@example.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 000 0000");

  const [serviceFee, setServiceFee] = useState("5");
  const [deliveryFee, setDeliveryFee] = useState("1500");
  const [maxDeliveryDistance, setMaxDeliveryDistance] = useState("25");
  const [deliveryTimeout, setDeliveryTimeout] = useState("15");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);

  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const sectionClass =
    "bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-5";

  const toggleClass = (checked: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? "bg-blue-600" : "bg-gray-300"
    }`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Platform Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure platform-wide settings and operational preferences.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl">
          <CheckCircle size={18} />
          Settings saved successfully (demo).
        </div>
      )}

      {/* General Settings */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">General Settings</h2>
            <p className="text-sm text-gray-500">
              Basic platform information and support contact.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Name
            </label>
            <input
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Support Email
            </label>
            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Support Phone
            </label>
            <div className="relative">
              <Phone
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Fees */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Platform Fees</h2>
            <p className="text-sm text-gray-500">
              Configure default service and delivery fees.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                className={`${inputClass} pr-10`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Delivery Fee (₦)
            </label>
            <input
              type="number"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Delivery Settings */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Truck className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Delivery Settings</h2>
            <p className="text-sm text-gray-500">
              Set delivery operational limits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Delivery Distance (km)
            </label>
            <input
              type="number"
              min="1"
              value={maxDeliveryDistance}
              onChange={(e) => setMaxDeliveryDistance(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Assignment Timeout (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={deliveryTimeout}
              onChange={(e) => setDeliveryTimeout(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Bell className="text-purple-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">
              Manage platform notification preferences.
            </p>
          </div>
        </div>

        {[
          {
            label: "Email Notifications",
            description: "Send platform notifications through email.",
            value: emailNotifications,
            setter: setEmailNotifications,
          },
          {
            label: "SMS Notifications",
            description: "Send important notifications through SMS.",
            value: smsNotifications,
            setter: setSmsNotifications,
          },
          {
            label: "Order Notifications",
            description: "Receive alerts when orders are created or updated.",
            value: orderNotifications,
            setter: setOrderNotifications,
          },
          {
            label: "Payment Notifications",
            description: "Receive alerts about payment activities.",
            value: paymentNotifications,
            setter: setPaymentNotifications,
          },
        ].map((setting) => (
          <div
            key={setting.label}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {setting.label}
              </p>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={setting.value}
              onClick={() => setting.setter(!setting.value)}
              className={`${toggleClass(setting.value)} flex-shrink-0`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  setting.value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* Security Settings */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <Shield className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">
              Configure administrator session preferences.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Session Timeout (minutes)
          </label>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className={inputClass}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="120">120 minutes</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          Security settings displayed here are demo preferences. Authentication,
          session enforcement, and security policies are not connected to this
          frontend.
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={18} />
          Save Settings
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          Settings are demo-only. Saving does not persist changes to the backend.
        </p>
      </div>
    </div>
  );
}
