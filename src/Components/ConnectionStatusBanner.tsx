// src/Components/ConnectionStatusBanner.tsx
import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g" | string;

type NetworkInformationLike = {
  downlink?: number; // Mbps
  effectiveType?: NetworkEffectiveType;
  rtt?: number; // ms
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

type ConnectionQuality = "offline" | "very-poor" | "poor" | "normal" | "good";

type StatusState = {
  online: boolean;
  quality: ConnectionQuality;
  effectiveType?: NetworkEffectiveType;
  downlink?: number;
};

function computeQuality(
  online: boolean,
  info?: NetworkInformationLike | null
): ConnectionQuality {
  if (!online) return "offline";

  if (!info) {
    return "normal";
  }

  const downlink = info.downlink ?? 0;
  const type = (info.effectiveType ?? "").toLowerCase() as NetworkEffectiveType;

  if (type === "slow-2g" || type === "2g" || (downlink > 0 && downlink < 0.3)) {
    return "very-poor";
  }

  if (type === "3g" || (downlink > 0 && downlink < 1)) {
    return "poor";
  }

  if (type === "4g" && downlink >= 5) {
    return "good";
  }

  return "normal";
}

export const ConnectionStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<StatusState>(() => {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    const conn =
      typeof navigator !== "undefined"
        ? ((navigator as any).connection as NetworkInformationLike | undefined)
        : undefined;

    return {
      online,
      quality: computeQuality(online, conn),
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
    };
  });

  // 👇 controls visibility for 5–6 seconds
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      const conn = (navigator as any).connection as
        | NetworkInformationLike
        | undefined;
      const online = true;
      setStatus({
        online,
        quality: computeQuality(online, conn),
        effectiveType: conn?.effectiveType,
        downlink: conn?.downlink,
      });
    };

    const handleOffline = () => {
      const conn = (navigator as any).connection as
        | NetworkInformationLike
        | undefined;
      const online = false;
      setStatus({
        online,
        quality: computeQuality(online, conn),
        effectiveType: conn?.effectiveType,
        downlink: conn?.downlink,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const conn = (navigator as any).connection as
      | NetworkInformationLike
      | undefined;

    const handleConnectionChange = () => {
      const online = navigator.onLine;
      setStatus({
        online,
        quality: computeQuality(online, conn),
        effectiveType: conn?.effectiveType,
        downlink: conn?.downlink,
      });
    };

    if (conn && typeof conn.addEventListener === "function") {
      conn.addEventListener("change", handleConnectionChange);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn && typeof conn.removeEventListener === "function") {
        conn.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  const { online, quality } = status;
  const isOffline = !online || quality === "offline";
  const isVeryPoor = quality === "very-poor";

  // 🔥 Auto-show for bad state, hide after 6s
  useEffect(() => {
    let timeoutId: number | undefined;

    if (isOffline || isVeryPoor) {
      // show banner
      setVisible(true);
      // auto hide after 6000 ms
      timeoutId = window.setTimeout(() => {
        setVisible(false);
      }, 6000);
    } else {
      // good/normal → hide immediately
      setVisible(false);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isOffline, isVeryPoor]);

  if (!visible || (!isOffline && !isVeryPoor)) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-4 z-[9998] -translate-x-1/2">
      <div
        className={`flex max-w-[360px] items-center gap-3 rounded-xl border px-3 py-2 text-xs shadow-lg
          ${
            isOffline
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full
            ${
              isOffline
                ? "bg-rose-500 text-white"
                : "bg-amber-500 text-white"
            }`}
        >
          {isOffline ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold">
            {isOffline ? "You are offline" : "Very slow internet connection"}
          </div>
          <div className="mt-0.5 text-[11px] leading-tight opacity-80">
            {isOffline
              ? "Some actions may not work until you’re back online."
              : "The app may feel slow or laggy while connection remains weak."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;
