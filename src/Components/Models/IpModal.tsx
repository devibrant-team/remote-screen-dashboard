import React, { useEffect, useState } from "react";

export const STORAGE_KEY = "server_ip";

export const getServerIp = () => {
  return localStorage.getItem(STORAGE_KEY);
};

const isValidIp = (value: string) => {
  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

  return ipRegex.test(value.trim());
};

const IpModal = () => {
  const [ip, setIp] = useState("");
  const [savedIp, setSavedIp] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkIp = () => {
      const storedIp = localStorage.getItem(STORAGE_KEY);

      if (storedIp && isValidIp(storedIp)) {
        setSavedIp(storedIp);
        setIp(storedIp);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setSavedIp(null);
        setIp("");
      }

      setIsChecking(false);
    };

    checkIp();

    window.addEventListener("server-ip-changed", checkIp);

    return () => {
      window.removeEventListener("server-ip-changed", checkIp);
    };
  }, []);

  const handleSave = () => {
    if (!isValidIp(ip)) {
      setError("Please enter a valid IP address, for example: 192.168.1.10");
      return;
    }

    localStorage.setItem(STORAGE_KEY, ip.trim());
    setSavedIp(ip.trim());
    setError("");
  };

  if (isChecking) return null;

  if (savedIp) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80">
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-black">
          Server Configuration
        </h2>

        <p className="mb-5 text-sm text-gray-600">
          Please enter the server IP address to continue.
        </p>

        <input
          value={ip}
          onChange={(e) => {
            setIp(e.target.value);
            setError("");
          }}
          placeholder="192.168.1.10"
          autoFocus
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-black"
        />

        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <button
          onClick={handleSave}
          className="mt-5 w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
};

export default IpModal;