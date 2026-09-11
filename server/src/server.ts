import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';

async function main(): Promise<void> {
  await connectDB(config.mongoUri);
  console.log(`[db] connected: ${config.mongoUri}`);

  const app = createApp();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[api] PropIntel AI server listening on http://0.0.0.0:${config.port}`);
    console.log(`[ai] provider: ${config.ai.provider}`);
  });

  const shutdown = async (): Promise<void> => {
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('[fatal]', err);
  process.exit(1);
});
