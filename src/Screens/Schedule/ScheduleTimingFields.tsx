import React from "react";
import TimeFieldWithPicker from "../../Components/TimeFieldWithPicker";

/* -------------------------------- helpers -------------------------------- */
const toHMS = (v: string) => (v?.length === 5 ? `${v}:00` : v || "00:00:00");

const toDateInput = (d: string) => {
  if (!d) return "";
  const sep = d.includes("-") ? "-" : "/";
  const [a, b, c] = d.split(sep);
  const y = Number(a) > 31 ? a : c;
  const m = Number(a) > 31 ? b : b;
  const dd = Number(a) > 31 ? c : a;
  const pad = (x: string | number) => String(x).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(dd)}`;
};

const fromDateInput = (v: string) => {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}-${m}-${y}`;
};

/* --------------------------------- types --------------------------------- */
export type ScheduleTimingFieldsProps = {
  startDate: string; // DD-MM-YYYY or YYYY-MM-DD
  endDate: string;   // DD-MM-YYYY or YYYY-MM-DD
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string;   // HH:mm:ss or HH:mm
  disabled?: boolean;
  className?: string;
  onStartDateChange: (ddmmyyyy: string) => void;
  onEndDateChange: (ddmmyyyy: string) => void;
  onStartTimeChange: (hms: string) => void;
  onEndTimeChange: (hms: string) => void;
};

/* --------------------------- presentational UI --------------------------- */
const ScheduleTimingFields: React.FC<ScheduleTimingFieldsProps> = ({
  startDate,
  endDate,
  startTime,
  endTime,
  disabled,
  className,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  return (
    <section className={className}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
        Timing
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {/* Start date */}
        <div className="space-y-1.5">
          <label className="block text-[11px] text-gray-600">Start date</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            value={toDateInput(startDate)}
            onChange={(e) => onStartDateChange(fromDateInput(e.target.value))}
            disabled={disabled}
          />
        </div>

        {/* End date */}
        <div className="space-y-1.5">
          <label className="block text-[11px] text-gray-600">End date</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            value={toDateInput(endDate)}
            onChange={(e) => onEndDateChange(fromDateInput(e.target.value))}
            disabled={disabled}
          />
        </div>

        {/* Start time */}
        <div className="space-y-1.5">
          <TimeFieldWithPicker
            label="Start time"
            value={toHMS(startTime)}
            onChange={onStartTimeChange}
            minuteStep={1}
            secondStep={1}
            disabled={disabled}
            compact
          />
        </div>

        {/* End time */}
        <div className="space-y-1.5">
          <TimeFieldWithPicker
            label="End time"
            value={toHMS(endTime)}
            onChange={onEndTimeChange}
            minuteStep={1}
            secondStep={1}
            disabled={disabled}
            compact
          />
        </div>
      </div>
    </section>
  );
};

export default ScheduleTimingFields;
