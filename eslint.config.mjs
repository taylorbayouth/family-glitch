import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable rules that conflict with our development style
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Allow any type when prototyping
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unescaped quotes in JSX
      "react/no-unescaped-entities": "off",
      // Allow missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",
    }
  }
];

export default eslintConfig;
