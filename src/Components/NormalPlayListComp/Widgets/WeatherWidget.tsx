import { useEffect, useState } from "react";

type WeatherData = {
  location: { name: string; country: string };
  current: { temp_c: number; condition: { text: string; icon: string } };
};

type Props = {
  city?: string;        // pass slot.widget.city; defaults to "Baalbek"
  className?: string;   // optional extra styling from parent
  compact?: boolean;    // optional smaller variant
};

const WeatherWidget = ({ city = "Baalbek", className = "", compact = false }: Props) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = "c07b66365dfb4f2eaa3153827251108";

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(
        city
      )}&aqi=no`,
      { signal: ctrl.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch weather data");
        return res.json();
      })
      .then((data) => setWeather(data))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });

    return () => ctrl.abort();
  }, [city]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!weather) return <p>Loading weather...</p>;

  const rawIcon = weather.current.condition.icon;
  const icon =
    rawIcon.startsWith("//") ? `https:${rawIcon}` : rawIcon;

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
      <img src={icon} alt={weather.current.condition.text} />
      <p className={`${compact ? "text-lg" : "text-xl"} font-bold`}>
        {weather.current.temp_c}°C
      </p>
      <p className="text-sm text-gray-700">{weather.current.condition.text}</p>
    </div>
  );
};

export default WeatherWidget;
