import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["'Noto Serif'", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        border: "rgba(200, 197, 209, 0.15)",
        input: "#f6f2f8",
        ring: "#365baa",
        background: "#fcf8fe",
        foreground: "#1c1b1f",
        primary: {
          DEFAULT: "#1b1a50",
          foreground: "#ffffff",
          container: "#313167"
        },
        secondary: {
          DEFAULT: "#365baa",
          foreground: "#ffffff",
          container: "#5c7fd0"
        },
        tertiary: {
          DEFAULT: "#002531",
          foreground: "#ffffff",
          container: "#98c8de"
        },
        surface: {
          DEFAULT: "#fcf8fe",
          containerLow: "#f6f2f8",
          containerHighest: "#e5e1e7",
        },
        ghost: {
          DEFAULT: "transparent",
          border: "rgba(200, 197, 209, 0.15)"
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f6f2f8",
          foreground: "#1c1b1f",
        },
        accent: {
          DEFAULT: "#e8effc",
          foreground: "#14316f",
        },
        popover: {
          DEFAULT: "#fcf8fe",
          foreground: "#1c1b1f",
        },
        card: {
          DEFAULT: "#fcf8fe",
          foreground: "#1c1b1f",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
        xl: "0.75rem"
      },
      boxShadow: {
        "ambient": "0 24px 40px -12px rgba(28, 27, 31, 0.05)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
