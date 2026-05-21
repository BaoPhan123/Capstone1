const DISCOUNT_CODES = [
  "NEST5-A7KQ2",
  "HOME5-R9PX4",
  "DECO5-M3VT8",
  "ROOM5-L6NS1",
  "FURN5-Q2HD7",
  "STYLE5-X8CB5",
  "COZY5-W4JR9",
  "SPACE5-T7YL3",
  "NORA5-P5GE6",
  "SAVE5-Z1FU8"
];

const DISCOUNT_PERCENT = 5;

function normalizeDiscountCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isValidDiscountCode(code) {
  return DISCOUNT_CODES.includes(normalizeDiscountCode(code));
}

function getRandomDiscountCode() {
  return DISCOUNT_CODES[Math.floor(Math.random() * DISCOUNT_CODES.length)];
}

module.exports = {
  DISCOUNT_CODES,
  DISCOUNT_PERCENT,
  normalizeDiscountCode,
  isValidDiscountCode,
  getRandomDiscountCode
};
