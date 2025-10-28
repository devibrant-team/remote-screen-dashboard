import React, { useEffect, useId, useMemo, useState } from "react";
import { Clock } from "lucide-react";

export type TimeFieldWithPickerProps = {
  /** Controlled value: "HH:mm" or "HH:mm:ss" or "" */
  value: string;
  /** Emits strictly "HH:mm:ss" (seconds default to 00 if user typed only HH:mm) */
  onChange: (v: string) => void;
  /** Minutes step (>=1). Default 5 */
  minuteStep?: number;
  /** Seconds step (>=1). If 0 or <1 => hide seconds. Default 5 */
  secondStep?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  placeholder?: string; // default "HH:mm"
  compact?: boolean;
  modalTitle?: string; // optional title
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const pad2 = (n: number) => String(n).padStart(2, "0");
const snap = (n: number, step: number) => {
  const st = Math.max(1, Math.floor(step || 1));
  return n - (n % st);
};

const parseHMS = (v: string) => {
  if (!v) return { h: 0, m: 0, s: 0, ok: false };
  const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { h: 0, m: 0, s: 0, ok: false };
  const hh = clamp(Number(m[1]) || 0, 0, 23);
  const mm = clamp(Number(m[2]) || 0, 0, 59);
  const ss = clamp(Number(m[3] ?? "0") || 0, 0, 59);
  return { h: hh, m: mm, s: ss, ok: true };
};

const toHMS = (h: number, m: number, s: number) => `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[70] bg-black/20" onClick={onClose} aria-hidden="true" />
);

const ModalPanel: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <div
    className="fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[320px] max-w-[92vw] rounded-xl border border-gray-200 bg-white shadow-2xl"
    role="dialog"
    aria-modal="true"
  >
    {title && (
      <div className="px-3 py-2 border-b border-gray-200 text-[13px] font-semibold text-gray-900">
        {title}
      </div>
    )}
    <div className="p-3">{children}</div>
  </div>
);

const TimeFieldWithPicker: React.FC<TimeFieldWithPickerProps> = ({
  value,
  onChange,
  minuteStep = 5,
  secondStep = 5,
  disabled,
  label,
  className,
  id,
  placeholder = "HH:mm",
  compact = false,
  modalTitle = "Pick time (24-hour)",
}) => {
  const uid = id || useId();
  const showSeconds = !!(secondStep && secondStep >= 1);
  const mStep = Math.max(1, Math.floor(minuteStep || 1));
  const sStep = showSeconds ? Math.max(1, Math.floor(secondStep || 1)) : 1;

  // input text for typing
  const parsed = parseHMS(value);
  const [text, setText] = useState(value ? `${pad2(parsed.h)}:${pad2(parsed.m)}` : "");
  const [open, setOpen] = useState(false);

  // modal state
  const [h, setH] = useState(parsed.h);
  const [m, setM] = useState(snap(parsed.m, mStep));
  const [s, setS] = useState(showSeconds ? snap(parsed.s, sStep) : parsed.s);

  // sync on external value change
  useEffect(() => {
    const p = parseHMS(value);
    setText(value ? `${pad2(p.h)}:${pad2(p.m)}` : "");
    setH(p.h);
    setM(snap(p.m, mStep));
    setS(showSeconds ? snap(p.s, sStep) : p.s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mStep, sStep, showSeconds]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(
    () => Array.from({ length: Math.ceil(60 / mStep) }, (_, i) => i * mStep),
    [mStep]
  );
  const seconds = useMemo(
    () => (showSeconds ? Array.from({ length: Math.ceil(60 / sStep) }, (_, i) => i * sStep) : []),
    [showSeconds, sStep]
  );

  const applyModal = () => {
    onChange(toHMS(h, m, showSeconds ? s : 0));
    setText(`${pad2(h)}:${pad2(m)}`);
    setOpen(false);
  };



  const setNow = () => {
    const now = new Date();
    const hh = now.getHours();
    const mm = snap(now.getMinutes(), mStep);
    const ss = showSeconds ? snap(now.getSeconds(), sStep) : 0;
    setH(hh);
    setM(mm);
    setS(ss);
  };

  const onBlurNormalize = () => {
    if (!text) {
      onChange("");
      return;
    }
    const p = parseHMS(text.length === 5 ? `${text}:00` : text);
    if (p.ok) {
      const norm = toHMS(p.h, snap(p.m, mStep), showSeconds ? snap(p.s, sStep) : 0);
      onChange(norm);
      setText(`${pad2(p.h)}:${pad2(snap(p.m, mStep))}`);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const base = parseHMS(text ? (text.length === 5 ? `${text}:00` : text) : "00:00:00");
    let mm = snap(base.m, mStep);
    mm = (mm + (e.key === "ArrowUp" ? mStep : -mStep) + 60) % 60;
    const hh =
      e.key === "ArrowUp" && mm === 0 && base.m === 60 - mStep
        ? (base.h + 1) % 24
        : e.key === "ArrowDown" && mm === 60 - mStep && base.m === 0
        ? (base.h + 23) % 24
        : base.h;

    const norm = toHMS(hh, mm, showSeconds ? base.s : 0);
    onChange(norm);
    setText(`${pad2(hh)}:${pad2(mm)}`);
  };

  const inputBase =
    "w-full rounded-md border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400";
  const inputPad = compact ? "px-2 py-1" : "px-2 py-1.5";

  return (
    <div className={className}>
      {label && (
        <label htmlFor={`${uid}-time`} className="mb-1 block text-[11px] text-gray-600">
          {label}
        </label>
      )}

      <div className="relative flex items-center gap-2">
        <input
          id={`${uid}-time`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className={`${inputBase} ${inputPad} pr-9`}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={onBlurNormalize}
          onKeyDown={onKeyDown}
          aria-label="Time (24-hour, HH:mm or HH:mm:ss)"
        />

        <button
          type="button"
          className="absolute right-2 inline-flex items-center justify-center rounded-md p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-60"
          aria-label="Open time picker"
          disabled={disabled}
          onClick={() => setOpen(true)}
          tabIndex={0}
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <ModalPanel title={modalTitle}>
            <div className="flex items-center gap-2">
              {/* Hour */}
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={h}
                onChange={(e) => setH(clamp(Number(e.target.value) || 0, 0, 23))}
                aria-label="Hour (00–23)"
              >
                {hours.map((hh) => (
                  <option key={hh} value={hh}>
                    {pad2(hh)}
                  </option>
                ))}
              </select>

              {/* Minute */}
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={m}
                onChange={(e) => setM(snap(clamp(Number(e.target.value) || 0, 0, 59), mStep))}
                aria-label={`Minute (step ${mStep})`}
              >
                {minutes.map((mm) => (
                  <option key={mm} value={mm}>
                    {pad2(mm)}
                  </option>
                ))}
              </select>

              {/* Second (optional) */}
              {showSeconds && (
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                  value={s}
                  onChange={(e) => setS(snap(clamp(Number(e.target.value) || 0, 0, 59), sStep))}
                  aria-label={`Second (step ${sStep})`}
                >
                  {seconds.map((ss) => (
                    <option key={ss} value={ss}>
                      {pad2(ss)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={setNow}
                >
                  Now
                </button>
             
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
                  onClick={applyModal}
                >
                  Apply
                </button>
              </div>
            </div>
          </ModalPanel>
        </>
      )}
    </div>
  );
};

export default TimeFieldWithPicker;
