export function parseDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  let parsed;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    parsed = new Date(y, m - 1, d);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [a, b, c] = trimmed.split('/').map(Number);
    if (a > 12) parsed = new Date(c, b - 1, a);
    else parsed = new Date(c, a - 1, b);
  } else {
    parsed = new Date(trimmed);
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatAsIsoDate(value) {
  const date = parseDate(value);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(value, target) {
  const dateValue = parseDate(value);
  const dateTarget = parseDate(target);
  if (!dateValue || !dateTarget) return false;
  return (
    dateValue.getFullYear() === dateTarget.getFullYear() &&
    dateValue.getMonth() === dateTarget.getMonth() &&
    dateValue.getDate() === dateTarget.getDate()
  );
}

export function isOnOrBefore(value, target) {
  const dateValue = parseDate(value);
  const dateTarget = parseDate(target);
  return dateValue && dateTarget ? dateValue <= dateTarget : false;
}

export function isDateInRange(dateStr, startStr, endStr) {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  const start = startStr ? parseDate(startStr) : null;
  const end = endStr ? parseDate(endStr) : null;

  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

export function offsetDateString(baseDateStr, daysOffset) {
  const base = parseDate(baseDateStr);
  if (!base) return baseDateStr;
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + daysOffset);
  return formatAsIsoDate(d);
}

