// CountryCitySelect.tsx
import React, { useState } from "react";
import { useCountriesCities } from "../ReactQuery/Country/useCountriesCities";


const CountryCitySelect: React.FC = () => {
  const { data, isLoading, isError, error } = useCountriesCities();
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  if (isLoading) return <p>Loading countries...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  const countries = data ?? [];
  const selectedCountry = countries.find((c) => c.country === country);
  const cities = selectedCountry?.cities ?? [];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    setCity(""); // reset city when country changes
  };

  return (
    <div style={{ display: "flex", gap: "1rem", flexDirection: "column", maxWidth: 400 }}>
      <label>
        Country:
        <select value={country} onChange={handleCountryChange}>
          <option value="">-- Select country --</option>
          {countries.map((c) => (
            <option key={c.country} value={c.country}>
              {c.country}
            </option>
          ))}
        </select>
      </label>

      <label>
        City:
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!country}
        >
          <option value="">-- Select city --</option>
          {cities.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </label>

      {country && city && (
        <p>
          Selected: <b>{country}</b> / <b>{city}</b>
        </p>
      )}
    </div>
  );
};

export default CountryCitySelect;
