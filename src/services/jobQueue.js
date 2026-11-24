const { Queue } = require('bullmq');
const redis = require('../config/redis');
const httpError = require('../utils/httpError');

let queue;

function getQueue() {
  if (!queue) {
    queue = new Queue('medibook', { connection: redis });
    queue.on('error', error => console.error('Queue error:', error.message));
  }
  return queue;
}

function requireRedis() {
  if (redis.status !== 'ready') throw httpError(503, 'Redis is unavailable; please retry');
}

async function enqueue(name, data, jobId) {
  requireRedis();
  try {
    return await getQueue().add(name, data, {
      jobId, attempts: 5, backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true, removeOnFail: false,
    });
  } catch (error) {
    console.error('Could not enqueue job:', error.message);
    throw httpError(503, 'The job queue is unavailable; please retry');
  }
}

async function closeQueue() { if (queue) await queue.close(); }

module.exports = { getQueue, enqueue, requireRedis, closeQueue };
