// useCountriesCities.ts
import { useQuery } from "@tanstack/react-query";

export interface CountryWithCities {
  country: string;
  cities: string[];
}

interface CountriesResponse {
  error: boolean;
  msg: string;
  data: CountryWithCities[];
}

const BASE_URL = "https://countriesnow.space/api/v0.1/countries";

async function fetchCountries(): Promise<CountryWithCities[]> {
  const res = await fetch(BASE_URL);

  if (!res.ok) {
    throw new Error("Failed to fetch countries");
  }

  const json: CountriesResponse = await res.json();

  if (json.error) {
    throw new Error(json.msg || "API error");
  }

  return json.data; // [{ country: "Afghanistan", cities: ["Kabul", ...] }, ...]
}

export function useCountriesCities() {
  return useQuery({
    queryKey: ["countries-cities"],
    queryFn: fetchCountries,
    staleTime: Infinity, // they almost never change
  });
}
