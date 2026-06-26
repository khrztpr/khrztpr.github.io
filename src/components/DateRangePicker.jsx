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
      className="inline-flex items-center gap-3 rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-3 text-[#0F172A] shadow-sm transition duration-200 hover:bg-[#D1FAF5] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40"
    >
      <Calendar size={18} className="text-[#0F766E]" />
      <span className="text-sm font-medium">Select date range</span>
      {startDate && endDate ? (
        <span className="sr-only">{startDate} to {endDate}</span>
      ) : null}

      {datePickerOpen && (
        <div
          ref={datePickerRef}
          className="absolute left-0 z-20 mt-4 w-full max-w-sm rounded-[32px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-sm ring-1 ring-[#E2E8F0]/40"
        >
          <div className="grid gap-4">
            <label className="space-y-2 text-xs text-[#64748B]">
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
                className="w-full rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/30"
              />
            </label>

            <label className="space-y-2 text-xs text-[#64748B]">
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
                className="w-full rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/30"
              />
            </label>

            <button
              type="button"
              onClick={onDone}
              className="mt-1 inline-flex justify-center rounded-3xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B5C55]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </button>
  );
}

