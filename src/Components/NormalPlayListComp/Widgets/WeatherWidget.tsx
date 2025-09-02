// src/Components/NormalPlayListComp/Widgets/WeatherWidget.tsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";

type WeatherData = {
  location: { name: string; country: string };
  current: { temp_c: number; condition: { text: string; icon: string } };
};

type Props = {
  city?: string | null;       // pass slot.widget.city here
  className?: string;
  compact?: boolean;
};

const API_KEY = "95a938d2bf834d948ab150146250209"

const WeatherWidget = ({ city: cityProp, className = "", compact = false }: Props) => {
  const selectedCity = useSelector((s: RootState) => s.playlist.selectedCity);

  // prefer the prop (widget’s city), fall back to global selectedCity
  const city = (cityProp ?? selectedCity ?? "").trim();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // no city yet → don't call the API
    if (!city) {
      setWeather(null);
      setError(null);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = encodeURIComponent(city);
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${q}&aqi=no`,
          { signal: ctrl.signal }
        );

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = json?.error?.message || `WeatherAPI error (${res.status})`;
          throw new Error(msg);
        }

        setWeather(json as WeatherData);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load weather.");
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => ctrl.abort();
  }, [city]);

  if (!city) {
    return (
      <div className={`rounded-xl bg-black/30 text-white p-3 text-sm ${className}`}>
        Select a city to show weather.
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-xl bg-black/30 text-white p-3 text-sm ${className}`}>
        Loading weather…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl bg-black/30 text-white p-3 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!weather) return null;

  const rawIcon = weather.current.condition.icon;
  const icon = rawIcon?.startsWith("//") ? `https:${rawIcon}` : rawIcon;

  return (
    <div
      className={
        `flex flex-col items-center p-4 rounded-xl shadow ` +
        `bg-white/90 text-black backdrop-blur ${className}`
      }
    >
      <h2 className={`${compact ? "text-base" : "text-lg"} font-semibold mb-1`}>
        {weather.location.name}, {weather.location.country}
      </h2>
      {icon ? <img src={icon} alt={weather.current.condition.text} /> : null}
      <p className={`${compact ? "text-lg" : "text-xl"} font-bold`}>
        {weather.current.temp_c}°C
      </p>
      <p className="text-sm text-gray-700">{weather.current.condition.text}</p>
    </div>
  );
};

export default WeatherWidget;
