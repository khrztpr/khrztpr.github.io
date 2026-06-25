// Centralized area normalization utilities.
// Keeps the canonical mappings + fuzzy logic in one place.

const AREA_MAP = {
  'SAC SOUTH': 'South Sacramento',
  'FRESNO': 'Fresno',
  'SOL/COCO': 'Solano/Contra Costa',
  'SFO': 'San Francisco',
  'SCC': 'Santa Clara',
  'SAC NORTH': 'North Sacramento',
  'SCC ONLOK': 'Santa Clara Onlok',
  'ALC': 'Alameda',
  'BLS': 'BLS',
  'SONOMA': 'Sonoma',
  'SF ONLOK': 'San Francisco Onlok',
  'LLC (from sac south)': 'South Sacramento LLC',
  'SOCAL': 'South California',
  'HQ': 'Headquarters',
  'ALC ONLOK': 'Alameda Onlok',
  'LLC': 'LLC',
  'SAN DIEGO': 'San Diego',
  'SAN NORTH': 'North Sacramento'
};

export const AREA_MAP_TOOLTIP = Object.entries(AREA_MAP)
  .map(([k, v]) => `${k} → ${v}`)
  .join('; ');

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a, b) => {
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[al][bl];
};

// Normalize area using canonical map; fall back to fuzzy match for small typos
export function normalizeArea(raw) {
  if (raw === undefined || raw === null) return '';
  const key = String(raw || '').trim();
  if (key === '') return '';

  // simple memoization cache to avoid repeated expensive fuzzy computations
  if (!normalizeArea._cache) normalizeArea._cache = new Map();
  if (normalizeArea._cache.has(key)) return normalizeArea._cache.get(key);

  const up = key.toUpperCase();
  if (AREA_MAP[up]) {
    normalizeArea._cache.set(key, AREA_MAP[up]);
    return AREA_MAP[up];
  }

  // try direct match to normalized values
  for (const v of Object.values(AREA_MAP)) {
    if (v.toUpperCase() === up) {
      normalizeArea._cache.set(key, v);
      return v;
    }
  }

  // fuzzy match against AREA_MAP keys
  let best = { key: null, dist: Infinity };
  for (const candidate of Object.keys(AREA_MAP)) {
    const dist = levenshtein(up, candidate.toUpperCase());
    if (dist < best.dist) best = { key: candidate, dist };
  }

  // allow small typos: threshold 2 or 20% of length
  if (best.key && (best.dist <= 2 || best.dist <= Math.floor(up.length * 0.2))) {
    const mapped = AREA_MAP[best.key];
    normalizeArea._cache.set(key, mapped);
    return mapped;
  }

  normalizeArea._cache.set(key, key);
  return key;
}

