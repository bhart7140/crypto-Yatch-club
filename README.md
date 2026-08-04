# Crypto Yacht Club Poker Platform

## Architecture
Text diagram: **Next.js/React UI** (player table, wallet, staking, admin) talks over HTTPS to a **Fastify TypeScript API**. The API owns auth/RBAC, wallet ledger, rake configuration, staking, tournaments, and poker-table orchestration. **WebSocket table channels** broadcast hand state and receive player actions. **PostgreSQL** stores the authoritative ledger, users, audit logs, table/hand history, staking positions, and platform configuration. **Redis** stores sessions, rate-limit counters, table presence, and timeout queues. **Blockchain workers** watch supported-token deposits, queue withdrawals, and settle owner-rake transfers from the hot wallet. All admin changes, game actions, and money movements emit immutable audit entries.

## Tech stack choices
- Backend: Node.js + TypeScript + Fastify for high-throughput REST/WebSocket APIs with schema validation and security middleware.
- Frontend: React/Next.js with TypeScript for responsive player, wallet, staking, and admin dashboards.
- Data: PostgreSQL for ACID accounting; Redis for low-latency sessions, caches, and timers.
- Crypto: ethers.js for EVM-compatible tokens; BTC support should be configured through a gateway or dedicated UTXO worker.
- Deployment: Docker Compose for local/staging, with the same containers ready to map into Kubernetes.

## Database schema
The Prisma schema defines users, wallets, ledger transactions, platform config, cash tables, hands, game actions, tournaments, staking positions, and audit logs in `prisma/schema.prisma`.

Relationships:
- `User` owns many `Wallet`, `Transaction`, `StakePosition`, and `AuditLog` records.
- `Table` owns many `Hand` records; `Hand` owns many `GameAction` records.
- `Tournament` owns many registrations.
- `PlatformConfig` stores owner-managed rake %, tokens, wallet addresses, staking APY, tier policy, and withdrawal controls.

## API endpoints
All authenticated routes use JWT. Admin routes require `owner` or `admin` role unless noted.

### Auth
`POST /auth/login`
```json
{ "email": "alice@example.com", "password": "correct horse battery staple" }
```
Response:
```json
{ "accessToken": "eyJ..." }
```

### Wallet
`GET /wallet/transactions`
Response:
```json
{ "transactions": [{ "kind": "deposit", "token": "USDT", "amount": "1000000", "status": "confirmed" }] }
```

`POST /wallet/withdrawals`
```json
{ "token": "USDT", "amount": "500000", "address": "0xabc..." }
```
Response:
```json
{ "status": "queued" }
```

### Tables and play
`GET /tables`
Response:
```json
{ "tables": [{ "id": "tbl_1", "smallBlind": "1", "bigBlind": "2", "seatsOpen": 3 }] }
```

`POST /tables/:id/join`
```json
{ "buyIn": "200" }
```

WebSocket `/tables/:id/ws` sends actions like:
```json
{ "type": "raise", "amount": "12" }
```

### Admin
`POST /admin/config/rake`
```json
{ "rakePercent": 5 }
```
Response:
```json
{ "rakePercent": 5, "audit": "logged" }
```
The API rejects values below 1 or above 25.

`POST /admin/tournaments`
```json
{ "name": "Sunday Main", "startsAt": "2026-08-09T18:00:00Z", "buyIn": "100", "fee": "10" }
```

### Staking
`GET /staking/summary`, `POST /staking/stake`, `POST /staking/unstake`, and `POST /staking/claim` support the staking dashboard, tiered rake discounts, and reward claiming.

## Frontend component structure
```text
frontend/src/components/
  PokerTable.tsx          # responsive table, avatars, chips, actions, timer
  AdminDashboard.tsx      # metrics, rake controls, token/wallet/staking/admin tools
```
Recommended production app routes:
```text
/app/(auth)/login
/app/onboarding
/app/wallet
/app/tables
/app/tables/[id]
/app/tournaments
/app/staking
/app/admin
```

## Security design
- Passwords are bcrypt-hashed; JWTs should be short-lived and refreshed via secure, httpOnly cookies.
- RBAC gates user, moderator, admin, and owner capabilities.
- Zod validates request bodies; Prisma parameterization prevents SQL injection.
- Helmet, strict CORS, HTTPS-only cookies, CSRF tokens for browser-mutating requests, and rate limits protect exposed routes.
- Replay protection should sign wallet callbacks and WebSocket actions with monotonic action IDs.
- Sensitive private-key material is encrypted at rest; production should prefer KMS/HSM signing.
- Audit logs cover rake changes, token configuration, wallet updates, game actions, deposits, withdrawals, bans, promotions, and staking changes.

## Critical implementation snippets

### Rake calculation and transfer
`src/domain/rake.ts` validates the owner-configurable 1-25% rake and calculates discounted rake. `src/services/wallet.ts` records rake in the ledger and transfers it to the dedicated owner wallet.

### Staking logic
`src/domain/staking.ts` implements tiered loyalty and APY accrual. Higher tiers receive rake discounts that feed into `calculateRake`.

### Game engine core
`src/domain/poker.ts` creates and shuffles a deck using Node cryptographic randomness, stores a seed commitment for auditability, and evaluates seven-card Hold'em hands.

### Admin dashboard controls
`frontend/src/components/AdminDashboard.tsx` includes owner/admin controls for rake, tokens, tournaments, users, staking rewards, and logs.

## Implementation plan
1. Harden auth: registration, email verification, MFA for withdrawals/admin, refresh-token rotation, and full CSRF protection.
2. Complete WebSocket table actor: player state machine, side pots, timeouts, disconnect auto-fold, and tournament table balancing.
3. Add blockchain workers: deposit address derivation, confirmation tracking, withdrawal signing queues, hot-wallet limits, and owner-rake batching.
4. Build full Next.js app: onboarding, cashier, poker table, staking dashboard, tournament lobby, profile, and admin pages.
5. Add observability: structured logs, security alerts, metrics, traces, and immutable audit export.
6. Add compliance controls: jurisdiction gating, KYC/AML hooks, responsible-gaming limits, and suspicious-activity reports.
7. Deploy with TLS, WAF, secrets manager/KMS, database backups, Redis persistence policy, and incident runbooks.

## Local setup
```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm test
npm run typecheck
docker compose up --build
```

## Production notes and limitations
This repository provides a secure implementation foundation, not legal clearance to operate gambling. Before launch, obtain jurisdiction-specific legal review, gaming licenses, KYC/AML providers, independent RNG/game fairness audits, smart-contract/wallet audits, penetration testing, and custody insurance. Never store unencrypted hot-wallet private keys on application hosts; use KMS/HSM or a regulated custody provider.
