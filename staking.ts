export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type StakePosition = { amount: bigint; since: Date; rewardsClaimed: bigint };
const YEAR_MS = 365n * 24n * 60n * 60n * 1000n;

export function loyaltyTier(amount: bigint, daysStaked: number): { tier: LoyaltyTier; rakeDiscountBps: number } {
  if (amount >= 100_000n && daysStaked >= 90) return { tier: 'diamond', rakeDiscountBps: 2500 };
  if (amount >= 25_000n && daysStaked >= 30) return { tier: 'gold', rakeDiscountBps: 1500 };
  if (amount >= 5_000n && daysStaked >= 7) return { tier: 'silver', rakeDiscountBps: 750 };
  return { tier: 'bronze', rakeDiscountBps: 0 };
}

export function accruedRewards(position: StakePosition, asOf: Date, apyBps: number): bigint {
  if (apyBps < 0 || apyBps > 50_000) throw new RangeError('APY out of policy bounds.');
  const elapsed = BigInt(Math.max(0, asOf.getTime() - position.since.getTime()));
  const gross = position.amount * BigInt(apyBps) * elapsed / (10_000n * YEAR_MS);
  return gross > position.rewardsClaimed ? gross - position.rewardsClaimed : 0n;
}
