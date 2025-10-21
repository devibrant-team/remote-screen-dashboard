import { useMemo, useState, useEffect, useRef } from "react";
import { useStep } from "../../Hook/Schedule/StepContext";
import { Clock } from "lucide-react";

export default function StepControl() {
  const { stepMinutes, setStepMinutes } = useStep();
  const presets = [5, 10, 15, 30, 60] as const;
  const min = 1, max = 120;

  const isPreset = presets.includes(stepMinutes as (typeof presets)[number]);
  const [mode, setMode] = useState<"preset" | "custom">(isPreset ? "preset" : "custom");
  const [custom, setCustom] = useState<string>(String(stepMinutes));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // whenever step changes from elsewhere, keep custom typed in sync
    setCustom(String(stepMinutes));
  }, [stepMinutes]);

  useEffect(() => {
    if (mode === "custom") {
      // focus/select when turning into input
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [mode]);

  const hhmmss = useMemo(() => {
    const m = Math.max(min, Math.min(max, Math.floor(stepMinutes)));
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}:00`;
  }, [stepMinutes]);

  const applyCustom = () => {
    const n = Number(custom);
    if (!Number.isFinite(n)) {
      setCustom(String(stepMinutes));
      setMode("preset");
      return;
    }
    const clamped = Math.max(min, Math.min(max, Math.floor(n)));
    setStepMinutes(clamped);
    setMode("preset"); // switch back to dropdown after apply
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
        <Clock className="h-3.5 w-3.5 text-red-600" />
      </span>

      <span className="text-xs font-medium text-neutral-700">Step</span>

      {/* In-place switcher: select ↔ input */}
      <div className="relative">
        {mode === "preset" ? (
          <select
            value={
              isPreset ? String(stepMinutes) : "custom"
            }
            onChange={(e) => {
              if (e.target.value === "custom") {
                setMode("custom");
              } else {
                setStepMinutes(Number(e.target.value));
              }
            }}
            className="h-8 w-28 rounded-lg border border-neutral-300 bg-white px-2 text-xs text-neutral-900"
            aria-label="Time grid step (minutes)"
            title={`Grid & snap: Every ${hhmmss}`}
          >
            {/* If current is custom, show it as the first visible option */}
            {!isPreset && (
              <option value="custom">Custom ({stepMinutes}m)</option>
            )}
            {presets.map((p) => (
              <option key={p} value={p}>{p} min</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
        ) : (
          <input
            ref={inputRef}
            id="step-custom-min"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
              if (e.key === "Escape") {
                setCustom(String(stepMinutes));
                setMode("preset");
              }
            }}
            className="h-8 w-28 rounded-lg border border-neutral-300 bg-white px-2 text-xs text-neutral-900"
            placeholder="Minutes"
            aria-label="Custom minutes"
          />
        )}
      </div>

‹ 
    </div>
  );
}
