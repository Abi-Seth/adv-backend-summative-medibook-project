const router = require('express').Router();
const controller = require('../controllers/doctorController');
const reports = require('../controllers/reportController');

router.get('/', controller.list);
router.get('/:id/stats', reports.doctorStats);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
