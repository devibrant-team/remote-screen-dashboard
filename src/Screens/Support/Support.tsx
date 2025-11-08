// src/Pages/Support.tsx

import {
  Headset,
  MonitorSmartphone,
  RefreshCcw,
  CreditCard,
  Mail,
} from "lucide-react";

const Support = () => {
  return (
    <div className="px-4 md:px-6 py-8 md:py-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="bg-white border border-gray-200 rounded-2xl px-5 py-5 md:px-6 md:py-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Headset className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Support
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Quick help for your screens, players and billing.
              </p>
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-4 md:gap-6">
          {/* LEFT: COMMON ISSUES */}
          <section className="bg-white border border-gray-200 rounded-2xl px-5 py-5 md:px-6 md:py-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
              What do you need help with?
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Choose a topic that matches your issue.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Screen issue */}
              <button
                type="button"
                className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 mb-2 group-hover:bg-red-100">
                  <MonitorSmartphone className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Screen is not showing
                </span>
                <span className="mt-1 text-xs text-gray-600">
                  The TV is black, frozen, or offline.
                </span>
              </button>

              {/* Content issue */}
              <button
                type="button"
                className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 mb-2 group-hover:bg-red-100">
                  <RefreshCcw className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Content not updating
                </span>
                <span className="mt-1 text-xs text-gray-600">
                  New ads or playlists are not appearing.
                </span>
              </button>

              {/* Billing issue */}
              <button
                type="button"
                className="group flex flex-col items-start rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 mb-2 group-hover:bg-red-100">
                  <CreditCard className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Billing &amp; account
                </span>
                <span className="mt-1 text-xs text-gray-600">
                  Questions about invoices or your plan.
                </span>
              </button>
            </div>

            {/* Small checklist */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-800 mb-2">
                Before you contact us, quickly check:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• The player device has power and internet.</li>
                <li>• The right playlist is assigned to that screen.</li>
                <li>• Your time zone in settings is correct.</li>
              </ul>
            </div>
          </section>

          {/* RIGHT: CONTACT BOX */}
          <section className="bg-white border border-gray-200 rounded-2xl px-5 py-5 md:px-6 md:py-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Contact support
              </h2>
              <p className="text-xs text-gray-600 mb-4">
                If you still need help, send us a message.
              </p>

              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    Email support
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  We usually reply within{" "}
                  <span className="font-medium">1–4 business hours</span>.
                </p>
                <p className="mt-2 text-sm font-semibold text-red-600">
                  support@signage-app.com
                </p>
              </div>

              <p className="text-[11px] text-gray-500">
                Please include screen name, location, and a short description of
                the problem. Screenshots are very helpful.
              </p>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
            >
              Open email app
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Support;
