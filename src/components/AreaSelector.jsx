import React from 'react';
import { MapPin } from 'lucide-react';

export default function AreaSelector({
  areaReadonly,
  areaReadOnlyLabel,
  areaOptions,
  selectedArea,
  onAreaChange,
}) {
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-[#233663] bg-[#526084] px-5 py-3 shadow-sm text-[#FAF6F6]">

      {/* Icon block */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#233663]">
        <MapPin size={18} className="text-[#CB1F23]" />
      </div>

      {/* Label + control */}
      <div className="flex flex-col">

        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FAF6F6]/60">
          Area
        </span>

        {areaReadonly ? (
          <span className="mt-1 text-sm font-semibold text-[#FAF6F6]">
            {areaReadOnlyLabel}
          </span>
        ) : (
          <select
            value={selectedArea}
            onChange={(e) => onAreaChange(e.target.value)}
            className="mt-1 rounded-xl border border-[#233663] bg-[#233663] px-3 py-2 text-sm font-medium text-[#FAF6F6] outline-none transition-all duration-200 hover:border-[#CB1F23] focus:border-[#CB1F23] focus:ring-2 focus:ring-[#CB1F23]/30"
          >
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}

      </div>
    </div>
  );
}