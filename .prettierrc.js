// import tailwind from 'prettier-plugin-tailwindcss'

/** @type {import("prettier").Options} */
module.exports = {
  semi: false,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 90,
  tabWidth: 2,
  endOfLine: 'auto',
  // plugins: [tailwind],
  plugins: ['prettier-plugin-tailwindcss'],
  // plugins: [require("prettier-plugin-tailwindcss")],
  tailwindConfig: './tailwind.config.js',
};

// {
//   "arrowParens": "always",
//   "bracketSpacing": true,
//   "embeddedLanguageFormatting": "auto",
//   "htmlWhitespaceSensitivity": "css",
//   "insertPragma": false,
//   "jsxBracketSameLine": false,
//   "jsxSingleQuote": false,
//   "proseWrap": "preserve",
//   "quoteProps": "as-needed",
//   "requirePragma": false,
//   "semi": true,
//   "singleQuote": false,
//   "tabWidth": 2,
//   "trailingComma": "es5",
//   "useTabs": false,
//   "vueIndentScriptAndStyle": false,
//   "printWidth": 100
// }
