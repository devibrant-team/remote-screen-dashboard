import { useEffect, useState } from "react";

const OclockWidget = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24h for signage clarity
  }).format(now);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div
      aria-label="Clock showing Jeddah time"
      className="
        w-full h-full p-4 md:p-6
        rounded-2xl border border-white/15
        bg-white/10 backdrop-blur-sm
        text-white shadow-sm
        flex flex-col items-center justify-center
        select-none
      "
    >
      <div
        className="
          font-mono font-semibold leading-none tracking-tight
          [font-variant-numeric:tabular-nums]
          text-[clamp(28px,10vw,120px)]
        "
      >
        {time}
      </div>

      <div className="mt-2 opacity-80 text-sm md:text-base">{date}</div>

      <div className="mt-1 text-xs uppercase tracking-widest opacity-70">
        Jeddah • Asia/Riyadh
      </div>
    </div>
  );
};

export default OclockWidget;
