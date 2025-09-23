import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  // Backend files (Node.js)
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs", // Use CommonJS for backend
      globals: {
        ...globals.node, // Add Node.js globals
      },
    },
    plugins: { js },
    extends: ["js/recommended"],
  },
  // Jest test files
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);
