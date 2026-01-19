/**
 * DEPRECATED: This file is NOT used by Tailwind CSS v4
 *
 * Tailwind v4 uses CSS-based configuration instead of JavaScript config files.
 * All theme configuration is now in: app/globals.css using the @theme directive.
 *
 * This file is kept for reference only. Delete it if no longer needed.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
