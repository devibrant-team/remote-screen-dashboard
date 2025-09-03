import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";

const OclockWidget = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Grab city from the active slide's clock widget
  const { city, timeZone } = useSelector((state: RootState) => {
    const sIdx = state.playlist.selectedSlideIndex;
    let cityFromWidget: string | undefined;

    if (sIdx !== null) {
      const slide = state.playlist.slides[sIdx];
      const slotWithClock = slide?.slots.find(
        (s) => s.widget && s.widget.type === "clock"
      );
      cityFromWidget = (slotWithClock?.widget as any)?.city;
    }

    const cityFinal = cityFromWidget || state.playlist.selectedCity || "";

    // Map a few common Saudi cities to their time zones (all effectively Arabia Standard Time)
    // You can extend this as needed; default to Asia/Riyadh.
    const tz = "Asia/Riyadh";

    return { city: cityFinal, timeZone: tz };
  });

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div
      aria-label={`Clock showing ${city} time`}
      className="w-full h-full p-4 md:p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm text-white shadow-sm flex flex-col items-center justify-center select-none"
    >
      <div className="font-mono font-semibold leading-none tracking-tight [font-variant-numeric:tabular-nums] text-[clamp(28px,10vw,120px)]">
        {time}
      </div>

      <div className="mt-2 opacity-80 text-sm md:text-base">{date}</div>

      <div className="text-lg font-bold mt-5 uppercase tracking-widest opacity-70">
        {city}
      </div>
    </div>
  );
};

export default OclockWidget;
