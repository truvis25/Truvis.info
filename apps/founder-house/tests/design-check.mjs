import assert from "node:assert/strict";
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const pairs = [
  ["Primary text / page", "#07362d", "#f5f7f2", 4.5],
  ["Secondary text / page", "#53675c", "#f5f7f2", 4.5],
  ["Secondary text / section", "#53675c", "#e2efe8", 4.5],
  ["White text / primary action", "#ffffff", "#07362d", 4.5],
  ["Forest text / turquoise", "#07362d", "#43c6c5", 4.5],
  ["Selected interest / tint", "#07362d", "#e2efe8", 4.5],
  ["Input outline / white", "#7a8c83", "#ffffff", 3],
  ["Input outline / section", "#7a8c83", "#edf1e9", 3],
  ["Light text / dark section", "#c7d9cb", "#07362d", 4.5],
  ["Hero turquoise heading / forest", "#69d8d1", "#07362d", 4.5],
];
for (const [label, a, b, min] of pairs) {
  const r = contrast(a, b);
  assert.ok(r >= min, label + " contrast " + r.toFixed(2) + " below " + min);
  console.log("PASS " + label + ": " + r.toFixed(2) + ":1");
}
console.log(
  "10 semantic colour pairs pass their applicable contrast thresholds. This is not a full WCAG audit.",
);
