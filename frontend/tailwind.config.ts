import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Pink Theme (adapted from Flockhub)
        primary: '#908FFE',
        primaryLight: '#C4C2FF',
        primaryLighter: '#E0DFFF',
        background: '#FEFEFE',
        surface: '#F9F9F9',
        card: '#FFFFFF',
        cardHover: '#FFF0F6',
        cardAlt: '#F9F9F9',
        textPrimary: '#2D1B2E',
        textSecondary: '#6B5B73',
        border: '#E8D5E8',
        accent: '#DDA0DD',
        error: '#FF6B9D',
        // Keep existing shadcn colors for compatibility
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        unbounded: ['Unbounded', 'sans-serif']
      },
      fontSize: {
        'heading-xl': ['48px', { lineHeight: '56px', fontWeight: '800', letterSpacing: '0.02em' }],
        'heading-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'heading-md': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'heading-sm': ['18px', { lineHeight: '28px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }]
      },
      spacing: {
        'section': '40px',
        'card': '24px',
        'tight': '12px'
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        input: '6px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.05)',
        panel: '0 6px 20px rgba(0,0,0,0.1)'
      },
      width: {
        sidebar: '280px'
      },
      height: {
        navbar: '64px',
        progress: '6px'
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;