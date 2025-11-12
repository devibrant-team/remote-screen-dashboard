import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AppSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | boolean;
  className?: string; // you can still override width from outside
};

const CustomDropdown: React.FC<AppSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  loading,
  error,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || null;
  const showPlaceholder = !selected;

  const isDisabled = !!disabled || !!loading;

  const toggleOpen = () => {
    if (isDisabled) return;
    setOpen((o) => !o);
  };

  const handleSelect = (val: string, optDisabled?: boolean) => {
    if (optDisabled || isDisabled) return;
    onChange(val);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`
        relative inline-block w-52  
        ${className}
      `}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={toggleOpen}
        disabled={isDisabled}
        className={`
          flex w-full items-center justify-between gap-2 rounded-lg  bg-white px-3 py-2.5
          text-sm font-medium shadow-sm outline-none transition 
          ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-red-500"}
          focus-visible:ring-2
        `}
      >
        <span
          className={`flex-1 truncate ${
            showPlaceholder ? "text-neutral-400" : "text-neutral-800"
          }`}
        >
          {showPlaceholder ? placeholder : selected?.label}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-red-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          className="
            absolute z-20 mt-1 max-h-60 w-full overflow-auto scrollbar-hide
            rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg
          "
        >
          {loading && (
            <div className="px-3 py-2 text-neutral-500">Loading…</div>
          )}

          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-neutral-500">No options</div>
          )}

          {!loading &&
            options.map((opt) => {
              const isActive = opt.value === value;
              const isOptDisabled = !!opt.disabled;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value, isOptDisabled)}
                  className={`
                    flex w-full items-center justify-between px-3 py-2 text-left
                    transition 
                    ${isActive ? "bg-red-50 text-red-700" : "text-neutral-800"}
                    ${
                      isOptDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-neutral-50"
                    }
                  `}
                  disabled={isOptDisabled}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
        </div>
      )}

      {typeof error === "string" && (
        <p className="mt-1 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
};

export type { Option as AppSelectOption };
export default CustomDropdown;
