import { useState } from "react";
import {
  Building2,
  User,
  Store,
  Bell,
  Shield,
  Save,
} from "lucide-react";

function SettingsPage() {
  const [businessName, setBusinessName] = useState("CommerceHub Store");
  const [email, setEmail] = useState("business@example.com");
  const [phone, setPhone] = useState("+234 800 000 0000");
  const [address, setAddress] = useState("Ilorin, Kwara State, Nigeria");

  const [ownerName, setOwnerName] = useState("Business Owner");
  const [ownerEmail, setOwnerEmail] = useState("owner@example.com");

  const [currency, setCurrency] = useState("NGN");
  const [timezone, setTimezone] = useState("Africa/Lagos");

  const [orderNotifications, setOrderNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [deliveryNotifications, setDeliveryNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="space-y-8">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage your business profile, preferences and account settings.
                </p>
            </div>

            {/* Business Profile */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Building2 size={21} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900">Business Profile</h2>
                        <p className="text-sm text-slate-500">
                            Basic information about your business.
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Business Name
                        </label>
                        <input
                            value={businessName}
                            onChange={(event) => setBusinessName(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Business Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Phone Number
                        </label>
                        <input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Business Address
                        </label>
                        <input
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </section>
          {/* Account Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <User size={21} />
                  </div>
                  <div>
                      <h2 className="font-bold text-slate-900">Account Information</h2>
                      <p className="text-sm text-slate-500">
                          Manage the details of your business account owner.
                      </p>
                  </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                  <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                          Owner Name
                      </label>
                      <input
                          value={ownerName}
                          onChange={(event) => setOwnerName(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      />
                  </div>

                  <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                          Owner Email
                      </label>
                      <input
                          type="email"
                          value={ownerEmail}
                          onChange={(event) => setOwnerEmail(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      />
                  </div>
              </div>
          </section>

          {/* Store Preferences */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                      <Store size={21} />
                  </div>
                  <div>
                      <h2 className="font-bold text-slate-900">Store Preferences</h2>
                      <p className="text-sm text-slate-500">
                          Configure your store's regional preferences.
                      </p>
                  </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                  <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                          Currency
                      </label>
                      <select
                          value={currency}
                          onChange={(event) => setCurrency(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      >
                          <option value="NGN">Nigerian Naira (NGN)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="GBP">British Pound (GBP)</option>
                          <option value="EUR">Euro (EUR)</option>
                      </select>
                  </div>

                  <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                          Timezone
                      </label>
                      <select
                          value={timezone}
                          onChange={(event) => setTimezone(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      >
                          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="America/New_York">America/New_York</option>
                      </select>
                  </div>
              </div>
          </section>

          {/* Notification Preferences */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                      <Bell size={21} />
                  </div>
                  <div>
                      <h2 className="font-bold text-slate-900">Notifications</h2>
                      <p className="text-sm text-slate-500">
                          Choose which business activities you want to receive notifications about.
                      </p>
                  </div>
              </div>

              <div className="divide-y divide-slate-100">
                  <label className="flex items-center justify-between gap-4 py-4">
                      <div>
                          <p className="text-sm font-medium text-slate-800">New Orders</p>
                          <p className="text-xs text-slate-500">
                              Receive notifications when customers place orders.
                          </p>
                      </div>
                      <input
                          type="checkbox"
                          checked={orderNotifications}
                          onChange={(event) => setOrderNotifications(event.target.checked)}
                          className="h-5 w-5 accent-indigo-600"
                      />
                  </label>

                  <label className="flex items-center justify-between gap-4 py-4">
                      <div>
                          <p className="text-sm font-medium text-slate-800">Payment Updates</p>
                          <p className="text-xs text-slate-500">
                              Receive notifications about successful and failed payments.
                          </p>
                      </div>
                      <input
                          type="checkbox"
                          checked={paymentNotifications}
                          onChange={(event) => setPaymentNotifications(event.target.checked)}
                          className="h-5 w-5 accent-indigo-600"
                      />
                  </label>

                  <label className="flex items-center justify-between gap-4 py-4">
                      <div>
                          <p className="text-sm font-medium text-slate-800">Delivery Updates</p>
                          <p className="text-xs text-slate-500">
                              Receive notifications about delivery progress.
                          </p>
                      </div>
                      <input
                          type="checkbox"
                          checked={deliveryNotifications}
                          onChange={(event) => setDeliveryNotifications(event.target.checked)}
                          className="h-5 w-5 accent-indigo-600"
                      />
                  </label>

                  <label className="flex items-center justify-between gap-4 py-4">
                      <div>
                          <p className="text-sm font-medium text-slate-800">Email Notifications</p>
                          <p className="text-xs text-slate-500">
                              Receive business notifications through email.
                          </p>
                      </div>
                      <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(event) => setEmailNotifications(event.target.checked)}
                          className="h-5 w-5 accent-indigo-600"
                      />
                  </label>
              </div>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Shield size={21} />
                  </div>
                  <div>
                      <h2 className="font-bold text-slate-900">Security</h2>
                      <p className="text-sm text-slate-500">
                          Information about protecting your business account.
                      </p>
                  </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Shield size={20} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                      <p className="text-sm font-semibold text-amber-900">
                          Password management is not yet available
                      </p>
                      <p className="mt-1 text-sm text-amber-800">
                          Password updates and additional security controls will be
                          connected to the account authentication API in a later phase.
                      </p>
                  </div>
              </div>
          </section>

          {/* Save Changes */}
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:justify-end">
              {saved && (
                  <p className="text-sm font-medium text-emerald-600">
                      Settings saved successfully (demo only).
                  </p>
              )}

              <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                  <Save size={18} />
                  Save Changes
              </button>
          </div>
        </div>
    );
}

export default SettingsPage;