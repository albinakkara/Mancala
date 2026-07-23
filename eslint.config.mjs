import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        Worker: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        self: "readonly",
        MessageEvent: "readonly",
        AudioContext: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      react,
    },
    rules: {
      ...ts.configs.recommended.rules,
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astro.parser,
    },
    rules: {
      "react/no-unknown-property": "off",
    },
  },
];
