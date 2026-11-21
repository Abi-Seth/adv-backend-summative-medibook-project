require('dotenv').config({ quiet: true });

const app = require('./app');
const db = require('./config/db');
const redis = require('./config/redis');

const port = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log('MySQL connected');

    await redis.connect();
    await redis.ping();
    console.log('Redis connected');

    app.listen(port, () => {
      console.log(`MediBook API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start MediBook:', error.message);
    redis.disconnect();
    await db.end();
    process.exitCode = 1;
  }
}

startServer();
