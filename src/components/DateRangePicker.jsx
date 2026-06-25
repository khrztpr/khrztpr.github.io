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
      className="inline-flex items-center gap-3 rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-3 text-slate-900 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.35)] transition duration-200 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <Calendar size={18} />
      <span className="text-sm font-medium">Select date range</span>
      {startDate && endDate ? (
        <span className="sr-only">{startDate} to {endDate}</span>
      ) : null}

      {datePickerOpen && (
        <div
          ref={datePickerRef}
          className="absolute left-0 z-20 mt-4 w-full max-w-sm rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5"
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-xs text-slate-500">
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
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="space-y-2 text-xs text-slate-500">
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
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <button
              type="button"
              onClick={onDone}
              className="mt-1 inline-flex justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </button>
  );
}

