const router = require('express').Router();
const controller = require('../controllers/waitlistController');

router.post('/', controller.join);
router.get('/:doctorId', controller.list);

module.exports = router;
