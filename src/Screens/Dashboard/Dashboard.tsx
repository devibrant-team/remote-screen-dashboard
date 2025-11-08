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
} from "lucide-react";

const Dashboard = () => {
  const { data: ads, isLoading, isError } = useGetAds();

  return (
    <div className="px-4 md:px-6 py-8 md:py-10 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto space-y-6 h-full flex flex-col">
        {/* ADS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 flex-1 flex flex-col">
          {/* Loading state */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-red-500">
                Failed to load ads. Please try again.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && (!ads || ads.length === 0) && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-500">
              <p>No ads found.</p>
              <p className="mt-1">Create a new ad to see it here.</p>
            </div>
          )}

          {/* Swiper with ads */}
          {!isLoading && !isError && ads && ads.length > 0 && (
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
                  {ads.map((ad) => (
                    <SwiperSlide key={ad.id} className="h-full flex">
                      <div className="relative w-full h-full overflow-hidden rounded-2xl bg-white">
                        {ad.media_type === "image" && (
                          <img
                            src={ad.media}
                            alt={ad.description || `Ad #${ad.id}`}
                            className="w-full h-full object-fill"
                          />
                        )}

                        {ad.media_type === "video" && (
                          <video
                            src={ad.media}
                            className="w-full h-full object-fill"
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
