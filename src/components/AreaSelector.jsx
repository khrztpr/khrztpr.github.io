import React from 'react';

export default function AreaSelector({
  areaReadonly,
  areaReadOnlyLabel,
  areaOptions,
  selectedArea,
  onAreaChange,
  showNormalizationTooltip,
  normalizationTooltipText
}) {
  return (
    <>
      <div className="ml-4 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Area</span>

        {areaReadonly ? (
          <span className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-900 font-medium">
            {areaReadOnlyLabel}
          </span>
        ) : (
          <select
            value={selectedArea}
            onChange={(e) => onAreaChange(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          >
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}
      </div>

      {showNormalizationTooltip ? (
        <div className="mt-2 ml-4 text-xs text-slate-500" title={normalizationTooltipText}>
          Area labels are normalized for display (hover to see mappings).
        </div>
      ) : null}
    </>
  );
}

