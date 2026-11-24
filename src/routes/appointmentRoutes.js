const router = require('express').Router();
const controller = require('../controllers/appointmentController');

router.post('/', controller.book);
router.get('/:id', controller.get);
router.delete('/:id', controller.cancel);

module.exports = router;
