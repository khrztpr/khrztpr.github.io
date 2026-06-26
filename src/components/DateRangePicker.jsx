import React, { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function DateRangePicker({
  startDate,
  endDate,
  todayIso,
  datePickerOpen,
  setDatePickerOpen,
  setStartDate,
  setEndDate,
  datePickerRef,
  onDone
}) {
  const today = new Date();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const calendarDays = useMemo(() => {
    const days = getDaysInMonth(viewDate.year, viewDate.month);
    const offset = startOfMonth(viewDate.year, viewDate.month);

    const cells = [];

    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      const iso = new Date(viewDate.year, viewDate.month, d)
        .toISOString()
        .split('T')[0];
      cells.push(iso);
    }

    return cells;
  }, [viewDate]);

  const isInRange = (date) => {
    if (!date) return false;
    if (startDate && date === startDate) return true;
    if (endDate && date === endDate) return true;
    if (startDate && endDate && date > startDate && date < endDate) return true;
    return false;
  };

  const handlePick = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate('');
      return;
    }

    if (date < startDate) {
      setEndDate(startDate);
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const prevMonth = () => {
    setViewDate((v) => {
      if (v.month === 0) return { month: 11, year: v.year - 1 };
      return { month: v.month - 1, year: v.year };
    });
  };

  const nextMonth = () => {
    setViewDate((v) => {
      if (v.month === 11) return { month: 0, year: v.year + 1 };
      return { month: v.month + 1, year: v.year };
    });
  };

  return (
    <div className="relative inline-block">

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setDatePickerOpen((o) => !o)}
        className="inline-flex items-center gap-3 rounded-2xl border border-[#233663] bg-[#526084] px-5 py-3 text-[#FAF6F6] transition hover:bg-[#233663] focus:ring-2 focus:ring-[#CB1F23]/40"
      >
        <Calendar size={18} className="text-[#CB1F23]" />
        <span className="text-sm font-medium">
          Select date range
        </span>

        {startDate && endDate && (
          <span className="text-xs text-[#FAF6F6]/60">
            {startDate} → {endDate}
          </span>
        )}
      </button>

      {/* Calendar */}
      {datePickerOpen && (
        <div
          ref={datePickerRef}
          className="absolute left-0 z-30 mt-3 w-[340px] rounded-3xl border border-[#233663] bg-[#526084] p-4 shadow-2xl text-[#FAF6F6]"
        >

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="px-3 py-1 rounded-xl hover:bg-[#233663]"
            >
              ←
            </button>

            <div className="text-sm font-semibold">
              {new Date(viewDate.year, viewDate.month).toLocaleString(
                'default',
                { month: 'long', year: 'numeric' }
              )}
            </div>

            <button
              onClick={nextMonth}
              className="px-3 py-1 rounded-xl hover:bg-[#233663]"
            >
              →
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 text-[10px] uppercase text-[#FAF6F6]/50 mb-2 text-center">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div>
            <div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => (
              <button
                key={i}
                disabled={!date}
                onClick={() => handlePick(date)}
                className={`
                  h-9 w-9 rounded-xl text-xs transition
                  ${!date ? 'opacity-0' : ''}
                  ${isInRange(date)
                    ? 'bg-[#CB1F23] text-[#FAF6F6]'
                    : 'hover:bg-[#233663]'}
                `}
              >
                {date ? new Date(date).getDate() : ''}
              </button>
            ))}
          </div>

          {/* Footer */}
          <button
            onClick={onDone}
            className="mt-4 w-full rounded-2xl bg-[#CB1F23] py-2 text-sm font-semibold hover:bg-[#C65E50]"
          >
            Apply Range
          </button>

        </div>
      )}
    </div>
  );
}