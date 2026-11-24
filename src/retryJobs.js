require('dotenv').config({ quiet: true });

const redis = require('./config/redis');
const { getQueue, closeQueue } = require('./services/jobQueue');

async function retry() {
  try {
    await redis.connect();
    const jobs = await getQueue().getFailed();
    for (const job of jobs) await job.retry();
    console.log('Retried ' + jobs.length + ' failed jobs');
  } finally {
    await closeQueue();
    redis.disconnect();
  }
}

retry().catch(error => { console.error(error.message); process.exitCode = 1; });
