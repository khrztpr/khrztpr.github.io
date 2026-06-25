export const designTokens = {
  primary: {
    base: "#0F766E",
    hover: "#0B5C55",
    soft: "#D1FAF5",
  },
  secondary: {
    base: "#1D4ED8",
    soft: "#DBEAFE",
    charts: {
      blue: "#2563EB",
      cyan: "#0EA5E9",
      indigo: "#4F46E5",
    },
    ui: {
      cardAccent: "#E6FFFB",
      focusRing: "#38BDF8",
    },
  },
  status: {
    success: {
      base: "#16A34A",
      softBackground: "#DCFCE7",
      textPrimary: "#065F46",
    },
    warning: {
      base: "#D97706",
      softBackground: "#FFEDD5",
      textPrimary: "#7C2D12",
    },
    error: {
      base: "#DC2626",
      softBackground: "#FEE2E2",
      textPrimary: "#7F1D1D",
    },
    info: {
      base: "#3B82F6",
      softBackground: "#DBEAFE",
      textPrimary: "#0F172A",
    },
  },
  neutral: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    textPrimary: "#0F172A",
    textMuted: "#64748B",
  },
  accent: {
    highlight: "#F97316",
    highlightSoft: "#FFEDD5",
  },
  darkMode: {
    background: "#0B1220",
    card: "#111A2E",
    border: "#263244",
    textPrimary: "#E5E7EB",
    textMuted: "#A6B0BF",
    primaryAccent: "#14B8A6",
  },
} as const;

