import { useQuery } from "@tanstack/react-query";
export async function fetchCitiesByCountry(country: string): Promise<string[]> {
  const res = await fetch(
    "https://countriesnow.space/api/v0.1/countries/cities",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to load cities (${res.status})`);
  }

  const json = await res.json();
  // API returns { error: boolean, msg: string, data: string[] }
  if (json?.error) {
    throw new Error(json?.msg || "API returned an error");
  }

  const cities = Array.isArray(json?.data) ? json.data : [];
  return cities.filter(Boolean);
}

export function useSaudiCities() {
  return useQuery({
    queryKey: ["cities", "Saudi Arabia"],
    queryFn: () => fetchCitiesByCountry("Saudi Arabia"),
    // cache for 1 hour
    staleTime: 60 * 60 * 1000,
    // sort alphabetically
    select: (arr) => arr.slice().sort((a, b) => a.localeCompare(b)),
  });
}
