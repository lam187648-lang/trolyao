const BASIC_THEME_IDS = new Set(
  [...Array(13)].map((_, index) => String(index + 1)).concat("16")
);
const TOKEN_THEME_PRICES = new Map([
  ["14", 50],
  ["15", 50]
]);

module.exports = { BASIC_THEME_IDS, TOKEN_THEME_PRICES };
