const express = require('express');
const router = express.Router();
const countdownController = require('../controllers/countdownController');
const auth = require('../middleware/auth');

// 获取所有倒计时
router.get('/', auth.authenticateJWT, countdownController.getCountdowns);
// 新建倒计时
router.post('/', auth.authenticateJWT, countdownController.createCountdown);
// 更新倒计时
router.put('/:id', auth.authenticateJWT, countdownController.updateCountdown);
// 删除倒计时
router.delete('/:id', auth.authenticateJWT, countdownController.deleteCountdown);

module.exports = router; 