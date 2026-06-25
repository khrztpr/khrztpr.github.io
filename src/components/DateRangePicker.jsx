import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateRangePicker({
  startDate,
  endDate,
  todayIso,
  datePickerOpen,
  setDatePickerOpen,
  clampToMaxDate,
  setStartDate,
  setEndDate,
  datePickerRef,
  onDone
}) {
  return (
    <button
      type="button"
      onClick={() => setDatePickerOpen((open) => !open)}
      className="inline-flex items-center gap-3 rounded-[28px] border border-neutral.border bg-neutral.card px-5 py-3 text-neutral.textPrimary shadow-sm transition duration-200 hover:bg-primary.soft focus:outline-none focus:ring-2 focus:ring-primary.base/40"
    >
      <Calendar size={18} className="text-primary.base" />
      <span className="text-sm font-medium">Select date range</span>
      {startDate && endDate ? (
        <span className="sr-only">{startDate} to {endDate}</span>
      ) : null}

      {datePickerOpen && (
        <div
          ref={datePickerRef}
          className="absolute left-0 z-20 mt-4 w-full max-w-sm rounded-[32px] border border-neutral.border bg-neutral.card p-5 shadow-sm ring-1 ring-neutral.border/40"
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-xs text-neutral.textMuted">
              From
              <input
                type="date"
                value={startDate}
                max={todayIso}
                onChange={(e) => {
                  const nextStart = clampToMaxDate(e.target.value);
                  setStartDate(nextStart);
                  if (!endDate) setEndDate(nextStart);
                }}
                className="w-full rounded-3xl border border-neutral.border bg-neutral.card px-4 py-3 text-sm text-neutral.textPrimary outline-none transition focus:border-primary.base focus:ring-2 focus:ring-primary.base/30"
              />
            </label>

            <label className="space-y-2 text-xs text-neutral.textMuted">
              To
              <input
                type="date"
                value={endDate}
                max={todayIso}
                onChange={(e) => {
                  const nextEnd = clampToMaxDate(e.target.value);
                  setEndDate(nextEnd);
                  if (!startDate) setStartDate(nextEnd);
                }}
                className="w-full rounded-3xl border border-neutral.border bg-neutral.card px-4 py-3 text-sm text-neutral.textPrimary outline-none transition focus:border-primary.base focus:ring-2 focus:ring-primary.base/30"
              />
            </label>

            <button
              type="button"
              onClick={onDone}
              className="mt-1 inline-flex justify-center rounded-3xl bg-primary.base px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary.hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </button>
  );
}



