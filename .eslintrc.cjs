// Only the style rules we want auto-fixed; Prettier handles spacing and line breaks.
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
  rules: {
    curly: ["error", "all"],
    "one-var": ["error", "never"],
    "no-unused-expressions": "error",
    "no-extra-semi": "error"
  }
};
