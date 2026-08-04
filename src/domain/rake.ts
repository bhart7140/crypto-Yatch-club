export type RakeResult = { gross: bigint; rake: bigint; netToPotWinner: bigint; rakeBps: number };

export function assertRakePercent(percent: number): void {
  if (!Number.isFinite(percent) || percent < 1 || percent > 25) {
    throw new RangeError('Rake percentage must be between 1 and 25.');
  }
}

export function calculateRake(gross: bigint, rakePercent: number, discountBps = 0): RakeResult {
  if (gross < 0n) throw new RangeError('Gross amount cannot be negative.');
  assertRakePercent(rakePercent);
  if (discountBps < 0 || discountBps > 10_000) throw new RangeError('Invalid discount basis points.');
  const rakeBps = Math.floor(rakePercent * 100 * (10_000 - discountBps) / 10_000);
  const rake = gross * BigInt(rakeBps) / 10_000n;
  return { gross, rake, netToPotWinner: gross - rake, rakeBps };
}
