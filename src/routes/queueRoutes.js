const router = require('express').Router();
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { getQueue, requireRedis } = require('../services/jobQueue');

let dashboard;

router.use((req, res, next) => {
  requireRedis();
  // Create the dashboard on its first request, after Redis has connected.
  if (!dashboard) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
      queues: [new BullMQAdapter(getQueue(), { readOnlyMode: true })],
      serverAdapter,
    });
    dashboard = serverAdapter.getRouter();
  }
  return dashboard(req, res, next);
});

module.exports = router;
