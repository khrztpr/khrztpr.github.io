/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          base: "#0F766E",
          hover: "#0B5C55",
          soft: "#D1FAF5",
        },
        secondary: {
          base: "#1D4ED8",
          soft: "#DBEAFE",
          chartsBlue: "#2563EB",
          chartsCyan: "#0EA5E9",
          chartsIndigo: "#4F46E5",
        },
        // Status palette.
        // Keep both nested and flattened keys so current JSX classes resolve.
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
          // Flattened keys so `text-status-success-base`, `bg-status-success-softBackground`, etc work.
          successBase: "#16A34A",
          successSoftBackground: "#DCFCE7",
          successTextPrimary: "#065F46",
          warningBase: "#D97706",
          warningSoftBackground: "#FFEDD5",
          warningTextPrimary: "#7C2D12",
          errorBase: "#DC2626",
          errorSoftBackground: "#FEE2E2",
          errorTextPrimary: "#7F1D1D",
          infoBase: "#3B82F6",
          infoSoftBackground: "#DBEAFE",
          infoTextPrimary: "#0F172A",
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
      },
    },
  },
  plugins: [],
}