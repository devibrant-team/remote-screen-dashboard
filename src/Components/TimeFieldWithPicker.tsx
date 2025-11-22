import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

/* ----------------------- tiny helpers ----------------------- */
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);
const pad2 = (n: number) => String(n).padStart(2, "0");
const gen = (n: number) => Array.from({ length: n }, (_, i) => i);

type ParsedHMS = { h: number; m: number; s: number; ok: boolean };
const parseHMS = (v: string): ParsedHMS => {
  if (!v) return { h: 0, m: 0, s: 0, ok: false };
  const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { h: 0, m: 0, s: 0, ok: false };
  const hh = clamp(Number(m[1]) || 0, 0, 23);
  const mm = clamp(Number(m[2]) || 0, 0, 59);
  const ss = clamp(Number(m[3] ?? "0") || 0, 0, 59);
  return { h: hh, m: mm, s: ss, ok: true };
};
const toHMS = (h: number, m: number, s: number) =>
  `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

/* ----------------------- Compact Dropdown ----------------------- */
type DropdownProps = {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
  maxRows?: number;
};

const CompactDropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  label,
  disabled,
  maxRows = 6,
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(() =>
    Math.max(0, options.indexOf(value))
  );
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const ensureRect = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = Math.max(90, Math.min(140, r.width));
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const below = r.bottom + 4;
    const top = Math.min(below, window.innerHeight - 8 - 200);
    setRect({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    ensureRect();
    const ro = new ResizeObserver(ensureRect);
    ro.observe(document.documentElement);
    const onScroll = () => ensureRect();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", ensureRect);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", ensureRect);
    };
  }, [open, ensureRect]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLButtonElement>(
      `button[data-idx="${focusIdx}"]`
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [open, focusIdx]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (v: number) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const keyOnButton: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "ArrowDown" ||
      e.key === "ArrowUp"
    ) {
      e.preventDefault();
      setOpen(true);
      setFocusIdx(Math.max(0, options.indexOf(value)));
    }
  };

  const keyOnList: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commit(options[focusIdx] ?? value);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setFocusIdx(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setFocusIdx(options.length - 1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (/^\d$/.test(e.key)) {
      const cur = options[focusIdx] ?? 0;
      const nextTwo = Number(String(cur % 10) + e.key);
      const candidates = [Number(e.key), nextTwo].filter(
        (n) => Number.isFinite(n) && options.includes(n as number)
      ) as number[];
      if (candidates.length) {
        const idx = options.indexOf(candidates[candidates.length - 1]);
        setFocusIdx(idx);
      }
    }
  };
const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
  // Stop the default fast scroll
  e.preventDefault();

  // Smaller factor = slower scroll
  const factor = 0.25; // try 0.25, 0.2, etc.
  e.currentTarget.scrollTop += e.deltaY * factor;
};
  const maxHeight = Math.max(4, maxRows) * 32; // compact rows

  return (
    <div className="relative">
      <label className="mb-1 block text-[11px] text-gray-600">{label}</label>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={keyOnButton}
        title={pad2(value)}
      >
        {pad2(value)}
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 1000,
            }}
            className="rounded-lg border border-gray-200 bg-white shadow-xl"
          >
            <div
              ref={listRef}
              role="listbox"
              tabIndex={0}
              aria-label={label}
              onKeyDown={keyOnList}
              style={{ maxHeight, overflowY: "auto" }}
                onWheel={handleWheel} 
              className="p-1 scrollbar-hide overscroll-contain"
            >
              {options.map((opt, idx) => {
                const active = opt === value;
                const focused = idx === focusIdx;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-idx={idx}
                    className={
                      "h-8 w-full rounded-md px-2 text-left text-sm " +
                      (active
                        ? "bg-red-500 text-white"
                        : focused
                        ? "bg-red-50 text-red-700"
                        : "bg-white text-gray-800 hover:bg-gray-50")
                    }
                    onMouseEnter={() => setFocusIdx(idx)}
                    onClick={() => commit(opt)}
                    title={pad2(opt)}
                  >
                    {pad2(opt)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/* ----------------------- Public API ----------------------- */
export type TimeFieldWithPickerProps = {
  value: string; // "HH:mm:ss" or "HH:mm"
  onChange: (v: string) => void;
  minuteStep?: number;
  secondStep?: number;
  minuteOptions?: number[];
  secondOptions?: number[];
  normalizeOnBlur?: "snap" | "strict" | "none";
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  placeholder?: string;
  compact?: boolean;
};

/* ----------------------- Main ----------------------- */
const TimeFieldWithPicker: React.FC<TimeFieldWithPickerProps> = ({
  value,
  onChange,
  minuteStep = 1,
  secondStep = 1, // keep seconds meaningful
  minuteOptions,
  secondOptions,
  normalizeOnBlur = "none",
  disabled,
  label,
  className,
  id,
  placeholder = "HH:mm:ss", // ⬅️ default shows seconds
  compact = false,
}) => {
  const uid = id || useId();

  // options
  const hourOpts = useMemo(() => gen(24), []);
  const minuteOptsBase = useMemo(() => {
    if (Array.isArray(minuteOptions) && minuteOptions.length > 0) {
      const uniq = Array.from(new Set(minuteOptions.map((n) => clamp(n, 0, 59))));
      return uniq.sort((a, b) => a - b);
    }
    const step = Math.max(1, Math.floor(minuteStep || 1));
    return Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  }, [minuteOptions, minuteStep]);

  const secondOptsBase = useMemo(() => {
    if (Array.isArray(secondOptions) && secondOptions.length > 0) {
      const uniq = Array.from(new Set(secondOptions.map((n) => clamp(n, 0, 59))));
      return uniq.sort((a, b) => a - b);
    }
    const st = Math.max(1, Math.floor(secondStep || 1));
    return Array.from({ length: Math.ceil(60 / st) }, (_, i) => i * st);
  }, [secondOptions, secondStep]);

  // parse incoming
  const parsed = useMemo(() => parseHMS(value), [value]);

  // local text preview — NOW includes seconds
  const [text, setText] = useState(
    value ? `${pad2(parsed.h)}:${pad2(parsed.m)}:${pad2(parsed.s)}` : ""
  );
  // mirror state
  const [h, setH] = useState(parsed.h);
  const [m, setM] = useState(parsed.m);
  const [s, setS] = useState(parsed.s);

  // sync props → state (ensure HH:MM:SS in input)
  useEffect(() => {
    const nextText = value
      ? `${pad2(parsed.h)}:${pad2(parsed.m)}:${pad2(parsed.s)}`
      : "";
    if (text !== nextText) setText(nextText);
    if (h !== parsed.h) setH(parsed.h);
    if (m !== parsed.m) setM(parsed.m);
    if (s !== parsed.s) setS(parsed.s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, parsed.h, parsed.m, parsed.s]);

  const emit = (hh: number, mm: number, ss: number) => {
    const out = toHMS(hh, mm, ss);
    onChange(out);
    setText(`${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`); // ⬅️ show seconds
  };

  const onBlurNormalize = () => {
    if (!text) {
      onChange("");
      return;
    }
    const p = parseHMS(text.length === 5 ? `${text}:00` : text);
    if (!p.ok) return;

    if (normalizeOnBlur === "snap") {
      const nearest = (v: number, opts: number[]) => {
        let best = opts[0],
          diff = Math.abs(v - best);
        for (let i = 1; i < opts.length; i++) {
          const d = Math.abs(v - opts[i]);
          if (d < diff) {
            best = opts[i];
            diff = d;
          }
        }
        return best;
      };
      emit(
        p.h,
        minuteOptsBase.length ? nearest(p.m, minuteOptsBase) : p.m,
        secondOptsBase.length ? nearest(p.s, secondOptsBase) : p.s
      );
      return;
    }

    emit(p.h, p.m, p.s);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const base = parseHMS(
      text ? (text.length === 5 ? `${text}:00` : text) : "00:00:00"
    );
    const dir: 1 | -1 = e.key === "ArrowUp" ? 1 : -1;
    let hh = base.h;
    let mm = base.m + dir;
    if (mm > 59) {
      mm = 0;
      hh = (hh + 1) % 24;
    } else if (mm < 0) {
      mm = 59;
      hh = (hh + 23) % 24;
    }
    emit(hh, mm, base.s); // keeps seconds visible in input
  };

  const inputBase =
    "w-full rounded-md border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400";
  const inputPad = compact ? "px-2 py-1" : "px-2 py-1.5";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={`${uid}-time`}
          className="mb-1 block text-[11px] text-gray-600"
        >
          {label}
        </label>
      )}

      {/* Input row (always HH:MM:SS) */}
      <div className="relative mb-2 flex items-center gap-2">
        <input
          id={`${uid}-time`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className={`${inputBase} ${inputPad} pr-8`}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={onBlurNormalize}
          onKeyDown={onKeyDown}
          aria-label="Time (24-hour, HH:mm:ss)"
        />
        <span
          className="absolute right-1 inline-flex items-center justify-center rounded-md p-1 text-gray-500"
          aria-hidden
        >
          <Clock className="h-4 w-4" />
        </span>
      </div>

      {/* Compact dropdowns: Hour / Minute / Second */}
      <div className="grid grid-cols-3 gap-2">
        <CompactDropdown
          label="Hour"
          value={h}
          options={hourOpts}
          onChange={(v) => {
            setH(v);
            emit(v, m, s);
          }}
          disabled={disabled}
          maxRows={6}
        />
        <CompactDropdown
          label="Minute"
          value={m}
          options={minuteOptsBase.length ? minuteOptsBase : gen(60)}
          onChange={(v) => {
            setM(v);
            emit(h, v, s);
          }}
          disabled={disabled}
          maxRows={6}
        />
        <CompactDropdown
          label="Second"
          value={s}
          options={secondOptsBase.length ? secondOptsBase : gen(60)}
          onChange={(v) => {
            setS(v);
            emit(h, m, v);
          }}
          disabled={disabled}
          maxRows={6}
        />
      </div>
    </div>
  );
};

export default TimeFieldWithPicker;
