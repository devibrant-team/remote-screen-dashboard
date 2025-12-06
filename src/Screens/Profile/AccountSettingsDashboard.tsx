// src/Pages/AccountSettingsDashboard.tsx

import { useState } from "react";
import { useGetProfile } from "../../ReactQuery/Profile/GetProfile";
import SupportModal from "@/Components/Models/SupportModal";
import {
  resetSupportForm,
  setSupportCategory,
  setSupportDescription,
  setSupportTopicType,
} from "@/Redux/Support/SupportSlice";
import { useDispatch } from "react-redux";
type SkeletonLineProps = {
  className?: string;
};

const SkeletonLine = ({ className = "" }: SkeletonLineProps) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

function SkeletonAccountSettingsDashboard() {
  return (
    <div className="px-8 py-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* LEFT COLUMN SKELETON */}
        <div className="w-full lg:w-1/2 flex">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 h-full">
            {/* Header */}
            <SkeletonLine className="h-5 w-40" />

            <div className="mt-6 space-y-8">
              {/* Personal Information */}
              <section>
                <SkeletonLine className="h-4 w-32" />

                <div className="mt-4 space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <SkeletonLine className="h-3 w-20" />
                    <SkeletonLine className="h-9 w-full" />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <SkeletonLine className="h-3 w-24" />
                    <SkeletonLine className="h-9 w-full" />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <SkeletonLine className="h-3 w-24" />
                    <SkeletonLine className="h-9 w-full" />
                  </div>

                  {/* Button */}
                  <SkeletonLine className="h-8 w-32 mt-2" />
                </div>
              </section>

              {/* Security Settings */}
              <section>
                <SkeletonLine className="h-4 w-36" />

                <div className="mt-4 space-y-2">
                  <SkeletonLine className="h-3 w-32" />
                  <SkeletonLine className="h-9 w-full" />
                </div>

                <SkeletonLine className="h-8 w-40 mt-3" />
              </section>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN SKELETON */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* LICENSE & USAGE SKELETON */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <SkeletonLine className="h-5 w-40" />

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-20" />
              </div>

              <div className="flex justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 w-32" />
              </div>

              <div className="flex justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 w-16" />
              </div>

              <div className="flex justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 w-20" />
              </div>

              <div className="flex justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 w-24" />
              </div>

              {/* Screens progress */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-12" />
                </div>
                <SkeletonLine className="h-2 w-full rounded-full" />
              </div>

              {/* Storage progress */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-20" />
                </div>
                <SkeletonLine className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>

          {/* BILLING & PAYMENT SKELETON */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <SkeletonLine className="h-5 w-40" />

            <div className="mt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="h-3 w-28" />
              </div>

              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs">
                {/* Header */}
                <div className="grid grid-cols-[2fr,1fr,1fr] bg-gray-50 px-4 py-2">
                  <SkeletonLine className="h-3 w-20" />
                  <SkeletonLine className="h-3 w-16 justify-self-end" />
                  <SkeletonLine className="h-3 w-16 justify-self-end" />
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-3 border-t border-gray-100">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-16 justify-self-end" />
                  <SkeletonLine className="h-5 w-14 justify-self-end rounded-full" />
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-3 border-t border-gray-100">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-16 justify-self-end" />
                  <SkeletonLine className="h-5 w-14 justify-self-end rounded-full" />
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-3 border-t border-gray-100">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-16 justify-self-end" />
                  <SkeletonLine className="h-5 w-14 justify-self-end rounded-full" />
                </div>
              </div>

              <SkeletonLine className="h-3 w-64" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSettingsDashboard() {
  const { data: profile, isLoading, isError } = useGetProfile();
  const [supportOpen, setSupportOpen] = useState(false);
  const dispatch = useDispatch();
  if (isLoading) {
    return <SkeletonAccountSettingsDashboard />;
  }

  if (isError || !profile) {
    return (
      <div className="px-8 py-10">
        <div className="max-w-7xl mx-auto text-sm text-red-500">
          Failed to load account settings.
        </div>
      </div>
    );
  }

  const plan = profile.plan;

  // Screens usage
  let screensLabel = "0 / 0";
  let screensPercent = 0;

  if (plan && plan.num_screen > 0) {
    screensLabel = `${plan.used_screen} / ${plan.num_screen}`;
    screensPercent = Math.min(100, (plan.used_screen / plan.num_screen) * 100);
  }

  // Storage usage
  let storageLabel = "0 GB / 0 GB";
  let storagePercent = 0;

  if (plan) {
    const used = parseFloat(plan.used_storage ?? "0");
    const total = parseFloat(plan.storage ?? "0");

    storageLabel = `${used} GB / ${total} GB`;

    if (total > 0) {
      storagePercent = Math.min(100, (used / total) * 100);
    }
  }

  // Renewal date from expire_date
  let renewalDate = "—";
  if (plan?.expire_date) {
    const d = new Date(plan.expire_date);
    if (!Number.isNaN(d.getTime())) {
      renewalDate = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      renewalDate = plan.expire_date;
    }
  }

  return (
    <div className="px-8 py-10">
      {/* content container */}
      <div className="max-w-7xl mx-auto flex flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-1/2 flex">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 h-full">
            <h2 className="text-lg font-semibold text-gray-900">
              Account Settings
            </h2>

            <div className="mt-6 space-y-8">
              {/* Personal Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800">
                  Personal Information
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={profile.name ?? ""}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={profile.email}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </section>

              {/* Security Settings */}
              <section>
                <h3 className="text-sm font-semibold text-gray-800">
                  Security Settings
                </h3>

                <div className="mt-4 space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Current Password
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // fresh form
                    dispatch(resetSupportForm());

                    // this is an account/password issue → billing/account category
                    dispatch(setSupportCategory("billing"));
                    dispatch(setSupportTopicType("question"));
                    dispatch(
                      setSupportDescription(
                        "I forgot my password and cannot log in. Please help me reset my password or regain access to my account."
                      )
                    );

                    setSupportOpen(true);
                  }}
                  className="mt-3 inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition"
                >
                  Forget Password ?
                </button>
              </section>
            </div>
          </div>
        </div>

        {/* RIGHT: LICENSE & USAGE + BILLING */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* LICENSE & USAGE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              License &amp; Usage
            </h2>

            <div className="mt-5 space-y-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan Type</span>
                <span className="font-medium">{plan?.plan_name ?? "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Renewal Date</span>
                <span className="font-medium">{renewalDate}</span>
              </div>

              {/* NEW: Extra Screens */}
              <div className="flex justify-between">
                <span className="text-gray-500">Extra Screens</span>
                <span className="font-medium">
                  {plan ? plan.extra_screens : 0}
                </span>
              </div>

              {/* NEW: Extra Storage */}
              <div className="flex justify-between">
                <span className="text-gray-500">Extra Storage</span>
                <span className="font-medium">
                  {plan ? `${plan.extra_space} GB` : "0.00 GB"}
                </span>
              </div>

              {/* NEW: Payment Method */}
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium capitalize">
                  {plan?.payment_type ?? "—"}
                </span>
              </div>

              {/* Screens Used */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Screens Used</span>
                  <span className="font-semibold text-gray-800">
                    {screensLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${screensPercent}%` }}
                  />
                </div>
              </div>

              {/* Storage Used */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Storage Used</span>
                  <span className="font-semibold text-gray-800">
                    {storageLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BILLING & PAYMENT */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Billing &amp; Payment
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Recent Invoices
                </h3>
                <span className="text-[11px] text-gray-500">
                  Last 3 billing cycles
                </span>
              </div>

              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs">
                {/* Header */}
                <div className="grid grid-cols-[2fr,1fr,1fr] bg-gray-50 px-4 py-2 font-semibold text-gray-600">
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Status</span>
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700 hover:bg-gray-50 transition">
                  <span>Feb 2024</span>
                  <span className="text-right">$149.00</span>
                  <span className="text-right">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      Paid
                    </span>
                  </span>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700 hover:bg-gray-50 transition">
                  <span>Jan 2024</span>
                  <span className="text-right">$149.00</span>
                  <span className="text-right">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      Paid
                    </span>
                  </span>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700 hover:bg-gray-50 transition">
                  <span>Dec 2023</span>
                  <span className="text-right">$149.00</span>
                  <span className="text-right">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      Paid
                    </span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                Billing is processed automatically each cycle. For detailed
                invoices, please check your email or billing portal.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}

export default AccountSettingsDashboard;
