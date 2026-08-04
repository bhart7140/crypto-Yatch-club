import { buildServer } from './api/server.js';
const app = await buildServer();
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
