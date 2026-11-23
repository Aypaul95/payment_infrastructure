
import { useState } from "react";
import {
  Camera,
  CheckCircle,
  LockKeyhole,
  Save,
  UserRound,
} from "lucide-react";

export default function RiderProfilePage() {
  const [profile, setProfile] = useState({
    fullName: "John Rider",
    email: "john.rider@example.com",
    phone: "08012345678",
    address: "Tanke, Ilorin, Kwara State",
    vehicleType: "Motorcycle",
    vehicleRegistration: "KW-ILR-123AB",
    emergencyContact: "08098765432",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal and delivery vehicle information.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <UserRound size={36} />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-900">
              {profile.fullName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Delivery Rider
            </p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Active account
            </span>
          </div>

          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400"
            title="Profile photo upload will be implemented later"
          >
            <Camera size={16} />
            Change photo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your contact and personal details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Email address
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Phone number
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Emergency contact
              <input
                type="tel"
                name="emergencyContact"
                value={profile.emergencyContact}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Residential address
              <input
                name="address"
                value={profile.address}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Delivery vehicle information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Information about the vehicle you use for deliveries.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Vehicle type
              <select
                name="vehicleType"
                value={profile.vehicleType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Vehicle registration number
              <input
                name="vehicleRegistration"
                value={profile.vehicleRegistration}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <LockKeyhole
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
          />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Demo profile
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Changes currently update this page's local state only. Profile
              updates, identity verification, and secure document uploads
              will be connected to the backend later. Do not enter real
              sensitive information here.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {saved && (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle size={18} />
              Profile changes saved for this session.
            </p>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Save size={17} />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
