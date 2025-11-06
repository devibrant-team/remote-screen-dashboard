function AccountSettingsDashboard() {
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
                      defaultValue="John Doe"
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="john.doe@company.com"
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <button className="mt-2 inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition">
                    Update Profile
                  </button>
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

                <button className="mt-3 inline-flex items-center justify-center rounded-md bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition">
                  Change Password
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
                <span className="font-medium">professional</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Renewal Date</span>
                <span className="font-medium">March 15, 2024</span>
              </div>

              {/* Screens Used */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Screens Used</span>
                  <span className="font-semibold text-gray-800">26 / 50</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[52%] rounded-full bg-red-500" />
                </div>
              </div>

              {/* Storage Used */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Storage Used</span>
                  <span className="font-semibold text-gray-800">
                    12.5 GB / 50 GB
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[25%] rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* BILLING & PAYMENT */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Billing &amp; Payment
            </h2>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800">
                Recent Invoices
              </h3>

              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden text-xs">
                <div className="grid grid-cols-[2fr,1fr,1fr] bg-gray-50 px-4 py-2 font-semibold text-gray-600">
                  <span>Date</span>
                  <span>Amount</span>
                  <span className="text-right">Action</span>
                </div>

                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700">
                  <span>Feb 2024</span>
                  <span>$149.00</span>
                  <button className="ml-auto text-red-500 hover:text-red-600 font-medium">
                    Download
                  </button>
                </div>

                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700">
                  <span>Jan 2024</span>
                  <span>$149.00</span>
                  <button className="ml-auto text-red-500 hover:text-red-600 font-medium">
                    Download
                  </button>
                </div>

                <div className="grid grid-cols-[2fr,1fr,1fr] items-center px-4 py-2 border-t border-gray-100 text-gray-700">
                  <span>Dec 2023</span>
                  <span>$149.00</span>
                  <button className="ml-auto text-red-500 hover:text-red-600 font-medium">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettingsDashboard;
