require('dotenv').config({ quiet: true });

const { Worker } = require('bullmq');
const redis = require('./config/redis');
const db = require('./config/db');
const appointments = require('./services/appointmentService');
const waitlist = require('./services/waitlistService');
const { closeQueue } = require('./services/jobQueue');

async function start() {
  const connection = await db.getConnection();
  connection.release();
  await redis.connect();
  const worker = new Worker('medibook', async job => {
    if (job.name === 'confirmation') return appointments.confirmation(job.data);
    if (job.name === 'promotion') return waitlist.promote(job.data.appointment_id);
    throw new Error('Unknown job: ' + job.name);
  }, {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null,
    },
    concurrency: 1,
  });
  worker.on('failed', (job, error) => console.error('Job failed:', job?.id, error.message));
  worker.on('error', error => console.error('Worker error:', error.message));
  await worker.waitUntilReady();
  console.log('MediBook worker is running');

  async function stop() {
    await worker.close();
    await closeQueue();
    redis.disconnect();
    await db.end();
  }
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch(async error => {
  console.error('Unable to start worker:', error.message);
  redis.disconnect();
  await db.end();
  process.exitCode = 1;
});
