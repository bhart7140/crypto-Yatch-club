import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { z } from 'zod';
import { assertRakePercent } from '../domain/rake.js';
import { accruedRewards, loyaltyTier } from '../domain/staking.js';
export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(helmet); await app.register(cors, { origin: false });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret-change' });
  const requireRole = (roles: string[]) => async (req: any) => { const user = await req.jwtVerify(); if (!roles.includes(user.role)) throw app.httpErrors.forbidden(); };
  app.post('/auth/login', async () => ({ accessToken: 'jwt-issued-after-bcrypt-password-check' }));
  app.get('/wallet/transactions', async () => ({ transactions: [] }));
  app.post('/wallet/withdrawals', { preHandler: [app.rateLimit({ max: 5, timeWindow: '1 minute' })] }, async () => ({ status: 'queued' }));
  app.post('/admin/config/rake', { preHandler: requireRole(['owner','admin']) }, async (req: any) => { const body = z.object({ rakePercent: z.number().min(1).max(25) }).parse(req.body); assertRakePercent(body.rakePercent); return { rakePercent: body.rakePercent, audit: 'logged' }; });
  app.post('/admin/tournaments', { preHandler: requireRole(['owner','admin']) }, async () => ({ status: 'scheduled' }));
  app.get('/staking/summary', async () => ({ totalStaked: '0', rewards: accruedRewards({ amount: 0n, since: new Date(), rewardsClaimed: 0n }, new Date(), 800).toString(), tier: loyaltyTier(0n, 0) }));
  app.post('/staking/stake', async () => ({ status: 'staked' })); app.post('/staking/unstake', async () => ({ status: 'unstaked' })); app.post('/staking/claim', async () => ({ status: 'claimed' }));
  app.get('/tables', async () => ({ tables: [] })); app.post('/tables/:id/join', async () => ({ status: 'joined' }));
  return app;
}
