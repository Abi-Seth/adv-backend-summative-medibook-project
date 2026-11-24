require('dotenv').config({ quiet: true });

const app = require('./app');
const db = require('./config/db');
const redis = require('./config/redis');
const { closeQueue } = require('./services/jobQueue');

const port = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log('MySQL connected');

    await redis.connect();
    await redis.ping();
    console.log('Redis connected');

    const server = app.listen(port, () => {
      console.log(`MediBook API running on http://localhost:${port}`);
    });
    async function stop() {
      server.close(async () => {
        await closeQueue();
        redis.disconnect();
        await db.end();
      });
    }
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    console.error('Unable to start MediBook:', error.message);
    redis.disconnect();
    await db.end();
    process.exitCode = 1;
  }
}

startServer();
