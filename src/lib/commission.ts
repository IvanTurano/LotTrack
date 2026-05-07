/**
 * Calculate commission at 2.75% rate, rounded to 2 decimal places.
 * Canonical formula: Math.round(salesAmount * 0.0275 * 100) / 100
 */
export function calculateCommission(salesAmount: number): number {
  return Math.round(salesAmount * 0.0275 * 100) / 100;
}
