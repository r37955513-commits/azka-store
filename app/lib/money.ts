// تنسيق العملة الموحّد — الجنيه السوداني
export const CURRENCY = "ج.س";
export const USD_TO_SDG = 4900;

/** يحول مبلغاً بالدولار إلى الجنيه السوداني. */
export function usdToSdg(usd: number | string): number {
  return Math.round(Number(usd) * USD_TO_SDG);
}

/** ينسّق مبلغاً (بالجنيه) بفواصل الآلاف ولاحقة العملة. مثال: 24,500 ج.س */
export function fmt(amount: number | string): string {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
  return `${formatted} ${CURRENCY}`;
}
