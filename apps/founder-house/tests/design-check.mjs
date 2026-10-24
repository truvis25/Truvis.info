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
  ["Primary text / page", "#252420", "#fbfaf7", 4.5],
  ["Secondary text / page", "#655f58", "#fbfaf7", 4.5],
  ["Secondary text / section", "#655f58", "#f2eee7", 4.5],
  ["White text / primary action", "#fbfaf7", "#b64b30", 4.5],
  ["Accent text / page", "#b64b30", "#fbfaf7", 4.5],
  ["Selected interest / tint", "#963a23", "#f6e7db", 4.5],
  ["Input outline / white", "#8b8278", "#fbfaf7", 3],
  ["Input outline / section", "#8b8278", "#f2eee7", 3],
];
for (const [label, a, b, min] of pairs) {
  const r = contrast(a, b);
  assert.ok(r >= min, label + " contrast " + r.toFixed(2) + " below " + min);
  console.log("PASS " + label + ": " + r.toFixed(2) + ":1");
}
console.log(
  "8 semantic colour pairs pass their applicable contrast thresholds. This is not a full WCAG audit.",
);
