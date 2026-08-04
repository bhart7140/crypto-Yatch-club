import { describe, expect, it } from 'vitest';
import { calculateRake } from '../src/domain/rake.js';
import { accruedRewards, loyaltyTier } from '../src/domain/staking.js';
import { evaluate } from '../src/domain/poker.js';
describe('rake', () => { it('enforces 1-25 percent and discounts', () => { expect(calculateRake(10000n, 5).rake).toBe(500n); expect(calculateRake(10000n, 10, 2500).rake).toBe(750n); expect(() => calculateRake(1n, 0)).toThrow(); expect(() => calculateRake(1n, 26)).toThrow(); }); });
describe('staking', () => { it('calculates tiers and rewards', () => { expect(loyaltyTier(25_000n, 31).tier).toBe('gold'); expect(accruedRewards({amount: 10_000n, since: new Date('2026-01-01'), rewardsClaimed: 0n}, new Date('2027-01-01'), 1000)).toBe(1000n); }); });
describe('poker evaluator', () => { it('detects royal-equivalent straight flush', () => { const score = evaluate([{rank:14,suit:'s'},{rank:13,suit:'s'},{rank:12,suit:'s'},{rank:11,suit:'s'},{rank:10,suit:'s'},{rank:2,suit:'c'},{rank:3,suit:'d'}]); expect(score.label).toBe('straight_flush'); }); });
