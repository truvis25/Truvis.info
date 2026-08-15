const JURISDICTION_LABELS: Record<string, string> = {
  "AE-AJ": "Ajman, UAE",
  "AE-AZ": "Abu Dhabi, UAE",
  "AE-DU": "Dubai, UAE",
  "AE-FU": "Fujairah, UAE",
  "AE-RK": "Ras Al Khaimah, UAE",
  "AE-SH": "Sharjah, UAE",
  "AE-UQ": "Umm Al Quwain, UAE",
};

export function jurisdictionLabel(
  code: string | null | undefined,
): string {
  if (!code) return "";
  return JURISDICTION_LABELS[code] ?? code;
}
