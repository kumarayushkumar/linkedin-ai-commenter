/**
 * @type {import('prettier').Options}
 */
export default {
  tabWidth: 2,
  singleQuote: true,
  semi: false,
  trailingComma: "none",
  bracketSpacing: true,
  bracketSameLine: true,
  endOfLine: "lf",
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>", // Node.js built-in modules
    "<THIRD_PARTY_MODULES>", // Imports not matched by other special words or groups.
    "", // Empty line
    "^@plasmo/(.*)$",
    "",
    "^@plasmohq/(.*)$",
    "",
    "^~(.*)$",
    "",
    "^[./]"
  ]
}
