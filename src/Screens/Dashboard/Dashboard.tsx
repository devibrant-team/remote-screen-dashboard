// src/Pages/Dashboard.tsx

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
//@ts-ignore
import "swiper/css";
//@ts-ignore
import "swiper/css/pagination";
//@ts-ignore
import "swiper/css/navigation";

import { useGetAds } from "../../ReactQuery/Dashboard/GetAds";
import {
  HelpCircle,
  MonitorSmartphone,
  CreditCard,
  RefreshCw, // 👈 NEW
  AlertTriangle, // 👈 NEW
} from "lucide-react";

const Dashboard = () => {
  const {
    data: ads,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAds() as any; // لو الهوك مضبوط بتايب، شيل as any

  const hasAds = Array.isArray(ads) && ads.length > 0;

  return (
    <div className="px-4 md:px-6 py-8 md:py-10 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto space-y-6 h-full flex flex-col">
        {/* ADS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 flex-1 flex flex-col">
          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent" />
                <span>Loading your ads…</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && isError && (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">
                    Failed to load ads. Please try again.
                  </span>
                </div>
                {error?.message && (
                  <p className="text-[12px] text-red-600/80">
                    {String(error.message)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm border border-red-200 hover:bg-red-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty state (no ads) */}
          {!isLoading && !isError && !hasAds && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-sm font-semibold text-gray-800">
                  No ads found yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Once you create ads, they will appear here in a rotating
                  carousel so you can preview exactly what your players show.
                </p>
                {/* هنا ممكن تضيف زر ينقلك لصفحة إنشاء Ad */}
                {/* <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600">
                  Create your first ad
                </button> */}
              </div>
            </div>
          )}

          {/* Swiper with ads */}
          {!isLoading && !isError && hasAds && (
            <div className="mt-2 flex-1 flex flex-col">
              <div className="h-[260px] sm:h-[320px] md:h-[480px] lg:h-[620px]">
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  spaceBetween={24}
                  slidesPerView={1}
                  loop
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  navigation
                  className="rounded-2xl h-full"
                >
                  {ads.map((ad: any) => (
                    <SwiperSlide key={ad.id} className="h-full flex">
                      <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black">
                        {ad.media_type === "image" && (
                          <img
                            src={ad.media}
                            alt={ad.description || `Ad #${ad.id}`}
                            className="w-full h-full object-contain bg-black"
                          />
                        )}

                        {ad.media_type === "video" && (
                          <video
                            src={ad.media}
                            className="w-full h-full object-contain bg-black"
                            controls
                            muted
                            loop
                            autoPlay
                          />
                        )}

                        {ad.media_type !== "image" &&
                          ad.media_type !== "video" && (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm">
                              Unsupported media type: {ad.media_type}
                            </div>
                          )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}
        </div>

        {/* FAQ BUTTONS SECTION – Zendesk-style tiles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Help &amp; FAQ
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Find answers and quick guides about your platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* General FAQ */}
            <button
              type="button"
              onClick={() => {
                // TODO: download General FAQ PDF
              }}
              className="group flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-[#faf7f2] px-4 py-6 sm:px-6 sm:py-8 text-center text-sm font-medium text-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-red-200 transition-all min-h-[160px]"
            >
              <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 group-hover:bg-red-100">
                <HelpCircle className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">General FAQ</span>
              <span className="mt-1 text-[11px] sm:text-xs text-gray-500 max-w-[200px]">
                Learn the basics and get started quickly.
              </span>
            </button>

            {/* Screens & Devices FAQ */}
            <button
              type="button"
              onClick={() => {
                // TODO: download Screens/Devices FAQ PDF
              }}
              className="group flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-[#faf7f2] px-4 py-6 sm:px-6 sm:py-8 text-center text-sm font-medium text-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-red-200 transition-all min-h-[160px]"
            >
              <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 group-hover:bg-red-100">
                <MonitorSmartphone className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">
                Screens &amp; Devices
              </span>
              <span className="mt-1 text-[11px] sm:text-xs text-gray-500 max-w-[220px]">
                Setup screens, connect players and troubleshoot issues.
              </span>
            </button>

            {/* Billing & Payments FAQ */}
            <button
              type="button"
              onClick={() => {
                // TODO: download Billing FAQ PDF
              }}
              className="group flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-[#faf7f2] px-4 py-6 sm:px-6 sm:py-8 text-center text-sm font-medium text-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-red-200 transition-all min-h-[160px]"
            >
              <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 group-hover:bg-red-100">
                <CreditCard className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">
                Billing &amp; Payments
              </span>
              <span className="mt-1 text-[11px] sm:text-xs text-gray-500 max-w-[220px]">
                Understand invoices, renewals and payment methods.
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
