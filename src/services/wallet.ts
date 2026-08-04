import { ethers } from 'ethers';
import { calculateRake } from '../domain/rake.js';
export type TokenConfig = { symbol: string; address?: string; decimals: number; minConfirmations: number };
export type LedgerEntry = { userId?: string; token: string; amount: bigint; kind: 'deposit'|'withdrawal'|'rake'|'stake'|'reward'; txHash?: string; metadata?: Record<string, unknown> };
export interface Ledger { record(entry: LedgerEntry): Promise<void>; }
export class CryptoSettlementService {
  constructor(private ledger: Ledger, private ownerRakeWallet: string, private hotWallet: ethers.Signer) {
    if (!ethers.isAddress(ownerRakeWallet)) throw new Error('Invalid owner rake wallet');
  }
  async settleHandRake(args: { pot: bigint; rakePercent: number; token: TokenConfig; winnerUserId: string; discountBps?: number }) {
    const result = calculateRake(args.pot, args.rakePercent, args.discountBps ?? 0);
    await this.ledger.record({ userId: args.winnerUserId, token: args.token.symbol, amount: result.rake, kind: 'rake', metadata: { rakeBps: result.rakeBps } });
    // Production deployment should batch ERC-20 transfers from the hot wallet; native transfer shown for chain-agnostic clarity.
    const tx = result.rake > 0n ? await this.hotWallet.sendTransaction({ to: this.ownerRakeWallet, value: result.rake }) : undefined;
    return { ...result, txHash: tx?.hash };
  }
}
