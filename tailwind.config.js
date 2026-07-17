/** @type {import('tailwindcss').Config} */

// Rayze design system Tailwind configuration.
// All colors reference CSS variables defined in src/index.css so that
// dark/light theming is centralized and no hex values are hardcoded here.
module.exports = {
  // Enable class-based dark mode so a `.dark` class on <html>/<body> toggles theme.
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  
  "./*.{ts,tsx,js,jsx,html}"],
  theme: {
    // Centered container with responsive padding for consistent page gutters.
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Core Shadcn-style tokens (HSL channels supplied via CSS variables).
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
        // Rayze semantic brand extensions for status / feedback states.
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      // Border radii derived from the single --radius token for visual cohesion.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      // Font families: distinct heading vs body stacks for the Rayze brand.
      fontFamily: {
        heading: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Glossy shadow presets for elevated, polished surfaces.
      boxShadow: {
        glossy:
          "0 1px 2px 0 hsl(var(--foreground) / 0.04), 0 8px 24px -6px hsl(var(--foreground) / 0.12)",
        "glossy-lg":
          "0 2px 4px 0 hsl(var(--foreground) / 0.05), 0 20px 48px -12px hsl(var(--foreground) / 0.18)",
        "glossy-primary":
          "0 8px 24px -6px hsl(var(--primary) / 0.35)",
        "inner-glossy":
          "inset 0 1px 0 0 hsl(0 0% 100% / 0.12)",
      },
      // Background image utilities for glossy gradients / sheens.
      backgroundImage: {
        "gloss-sheen":
          "linear-gradient(180deg, hsl(0 0% 100% / 0.12) 0%, hsl(0 0% 100% / 0) 60%)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
