import React from "react";

const MaintenanceScreen: React.FC = () => {
  return (
    <div className="
      relative min-h-screen w-full p-4 flex items-center justify-center
      bg-[radial-gradient(900px_520px_at_120%_-10%,#e11931_0%,transparent_55%),radial-gradient(700px_420px_at_-10%_120%,#ffffff_0%,transparent_60%),linear-gradient(135deg,#fff5f6,#ffffff)]
      text-neutral-900
    ">
      <section
        className="
          w-full max-w-5xl grid grid-cols-1 md:grid-cols-2
          rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur
          shadow-[0_10px_30px_rgba(225,25,49,0.15),0_2px_10px_rgba(16,16,16,0.06)]
          overflow-hidden
        "
        role="status"
        aria-live="polite"
      >
        {/* Visual */}
        <aside className="order-first md:order-last bg-gradient-to-b from-white to-rose-50 relative grid place-items-center py-10 md:py-0">
          <div className="relative w-[78%] max-w-[360px] aspect-square">
            {/* Gear */}
            <svg
              viewBox="0 0 512 512"
              className="absolute inset-0 m-auto w-[72%] opacity-90 drop-shadow-[0_6px_18px_rgba(225,25,49,0.22)] animate-[spin_12s_linear_infinite]"
            >
              <path
                fill="#e11931"
                d="M487.4 315.7l-41.2-23.8c3.2-17.1 3.2-35 0-52.1l41.2-23.8c8.4-4.8 11.3-15.5 6.5-23.9l-40-69.3c-4.8-8.4-15.5-11.3-23.9-6.5l-41.3 23.8c-13.9-12-29.6-21.4-46.6-27.7V37.3c0-9.7-7.9-17.6-17.6-17.6h-80c-9.7 0-17.6 7.9-17.6 17.6v47.9c-17 6.3-32.7 15.7-46.6 27.7L98 89.3c-8.4-4.8-19.1-1.9-23.9 6.5l-40 69.3c-4.8 8.4-1.9 19.1 6.5 23.9l41.2 23.8c-3.2 17.1-3.2 35 0 52.1l-41.2 23.8c-8.4 4.8-11.3 15.5-6.5 23.9l40 69.3c4.8 8.4 15.5 11.3 23.9 6.5l41.3-23.8c13.9 12 29.6 21.4 46.6 27.7v47.9c0 9.7 7.9 17.6 17.6 17.6h80c9.7 0 17.6-7.9 17.6-17.6v-47.9c17-6.3 32.7-15.7 46.6-27.7l41.3 23.8c8.4 4.8 19.1 1.9 23.9-6.5l40-69.3c4.8-8.4 1.9-19.1-6.5-23.9zM256 344c-48.6 0-88-39.4-88-88s39.4-88 88-88 88 39.4 88 88-39.4 88-88 88z"
              />
            </svg>

            {/* Wrench */}
            <svg
              viewBox="0 0 512 512"
              className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_8px_20px_rgba(16,16,16,0.12)] animate-[float_3.6s_ease-in-out_infinite]"
            >
              <path
                fill="#ffffff"
                d="M501.1 84.7L416 169.8c-28.1 28.1-73.7 28.1-101.8 0-10.8-10.8-18.1-24.1-21.8-38.3L160 264l-72 24 24-72 132.5-132.5c14.2 3.7 27.5 11 38.3 21.8 28.1 28.1 28.1 73.7 0 101.8l-6.2 6.2"
                opacity="0.85"
              />
              <rect x="200" y="300" width="40" height="160" rx="12" fill="#e11931" />
            </svg>

            {/* Live badge */}
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-extrabold text-rose-700 shadow-[0_8px_20px_rgba(225,25,49,0.18)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
              </span>
              Live maintenance
            </div>
          </div>

          {/* Keyframes for float/spin */}
          <style>{`
            @keyframes float { 0%,100% { transform: translate(-50%,-50%) translateY(-6px) rotate(-10deg);}
                                50%      { transform: translate(-50%,-50%) translateY(6px) rotate(-6deg);} }
            @keyframes spin { to { transform: rotate(360deg);} }
          `}</style>
        </aside>

        {/* Content */}
        <div className="p-6 sm:p-8 md:p-10">
          {/* Brand */}
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-rose-600 text-white font-extrabold shadow-inner">
              IG
            </div>
            <div>
              <h1 className="m-0 text-sm font-extrabold tracking-wide">Iguana Software</h1>
              <small className="block -mt-0.5 text-xs font-semibold text-neutral-500">
                Maintenance Window
              </small>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            We’re <span className="text-rose-600">performing maintenance</span>
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-neutral-700">
            We’re tuning things up to keep your experience fast and secure. Thanks for your patience!
          </p>

          {/* Status pill */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
            </span>
            System offline
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse" />
            </div>
            <p className="mt-2 text-xs text-neutral-500">We’ll be back shortly.</p>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-white font-extrabold shadow-[0_8px_18px_rgba(225,25,49,0.28)] active:scale-[0.99]"
            >
              Refresh
            </button>

            <a
              href="#status"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-rose-600 bg-white px-4 py-2.5 font-extrabold text-rose-700"
            >
              Status Page
            </a>
          </div>

          {/* Contact */}
          <div className="mt-4 text-[14px] text-neutral-700">
            Need help?{" "}
            <a href="mailto:support@iguana-software.com" className="font-extrabold text-rose-700 underline-offset-2 hover:underline">
              support@iguana-software.com
            </a>{" "}
            or call{" "}
            <a href="tel:+96170000000" className="font-extrabold text-rose-700 underline-offset-2 hover:underline">
              +961 70 000 000
            </a>
            .
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[12px] text-neutral-500">
            © {new Date().getFullYear()} Iguana Software. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MaintenanceScreen;
