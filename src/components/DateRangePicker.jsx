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
    <div className="relative inline-block" ref={datePickerRef}>
      <button
        type="button"
        onClick={() => setDatePickerOpen((open) => !open)}
        className="inline-flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] px-5 py-3 text-[#0F172A] shadow-sm transition-all duration-200 hover:bg-[#D1FAF5] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
      >
        <Calendar size={18} className="text-[#0F766E]" />

        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs uppercase tracking-wider text-[#64748B]">
            Date Range
          </span>

          <span className="text-sm font-semibold">
            {startDate && endDate
              ? `${startDate} → ${endDate}`
              : 'Select dates'}
          </span>
        </div>
      </button>

      {datePickerOpen && (
        <div className="absolute left-0 top-full z-50 mt-3 w-96 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Select Date Range
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Dashboard metrics will update automatically.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  From
                </span>

                <input
                  type="date"
                  value={startDate}
                  max={todayIso}
                  onChange={(e) => {
                    const next = clampToMaxDate(e.target.value);
                    setStartDate(next);
                    if (!endDate) setEndDate(next);
                  }}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] transition focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  To
                </span>

                <input
                  type="date"
                  value={endDate}
                  max={todayIso}
                  onChange={(e) => {
                    const next = clampToMaxDate(e.target.value);
                    setEndDate(next);
                    if (!startDate) setStartDate(next);
                  }}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] transition focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDatePickerOpen(false)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#64748B] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onDone}
                className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5C55]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
