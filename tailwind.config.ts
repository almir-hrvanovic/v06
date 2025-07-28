import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '2560px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
          hover: "hsl(var(--sidebar-hover))",
          icon: "hsl(var(--sidebar-icon))",
          "icon-active": "hsl(var(--sidebar-icon-active))",
          "text-secondary": "hsl(var(--sidebar-text-secondary))",
          "badge-bg": "hsl(var(--sidebar-badge-bg))",
          "badge-text": "hsl(var(--sidebar-badge-text))",
          separator: "hsl(var(--sidebar-separator))",
          "logo-bg": "hsl(var(--sidebar-logo-bg))",
          "expand-button": "hsl(var(--sidebar-expand-button))",
          "expand-button-hover": "hsl(var(--sidebar-expand-button-hover))",
        },
      },
      spacing: {
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        'sidebar-expanded': 'var(--sidebar-width-expanded)',
        'sidebar-mobile': 'var(--sidebar-mobile-width)',
        'touch-target': 'var(--sidebar-touch-target-min)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { 
            transform: "translate3d(-100%, 0, 0)",
            opacity: "0"
          },
          to: { 
            transform: "translate3d(0, 0, 0)",
            opacity: "1"
          },
        },
        "slide-out": {
          from: { 
            transform: "translate3d(0, 0, 0)",
            opacity: "1"
          },
          to: { 
            transform: "translate3d(-100%, 0, 0)",
            opacity: "0"
          },
        },
        "expand-sidebar": {
          from: { width: "var(--sidebar-width-collapsed)" },
          to: { width: "var(--sidebar-width-expanded)" },
        },
        "collapse-sidebar": {
          from: { width: "var(--sidebar-width-expanded)" },
          to: { width: "var(--sidebar-width-collapsed)" },
        },
        "fade-in-overlay": {
          from: { 
            opacity: "0",
            backdropFilter: "blur(0px)"
          },
          to: { 
            opacity: "1",
            backdropFilter: "blur(4px)"
          },
        },
        "fade-out-overlay": {
          from: { 
            opacity: "1",
            backdropFilter: "blur(4px)"
          },
          to: { 
            opacity: "0",
            backdropFilter: "blur(0px)"
          },
        },
        "scale-in": {
          from: { 
            transform: "scale(0.8) rotate(-90deg)",
            opacity: "0"
          },
          to: { 
            transform: "scale(1) rotate(0deg)",
            opacity: "1"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in var(--sidebar-transition-duration) var(--sidebar-transition-timing)",
        "slide-out": "slide-out var(--sidebar-transition-duration) var(--sidebar-transition-timing)",
        "expand-sidebar": "expand-sidebar var(--sidebar-transition-duration) var(--sidebar-transition-timing)",
        "collapse-sidebar": "collapse-sidebar var(--sidebar-transition-duration) var(--sidebar-transition-timing)",
        "fade-in-overlay": "fade-in-overlay var(--sidebar-overlay-transition)",
        "fade-out-overlay": "fade-out-overlay var(--sidebar-overlay-transition)",
        "scale-in": "scale-in 0.3s ease-out",
      },
      transitionDuration: {
        'sidebar': 'var(--sidebar-transition-duration)',
        'sidebar-overlay': 'var(--sidebar-overlay-transition)',
      },
      transitionTimingFunction: {
        'sidebar': 'var(--sidebar-transition-timing)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;