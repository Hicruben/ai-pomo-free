const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const auth = require('../middleware/auth');

// 获取所有提醒
router.get('/', auth.authenticateJWT, reminderController.getReminders);
// 新建提醒
router.post('/', auth.authenticateJWT, reminderController.createReminder);
// 更新提醒
router.put('/:id', auth.authenticateJWT, reminderController.updateReminder);
// 删除提醒
router.delete('/:id', auth.authenticateJWT, reminderController.deleteReminder);

module.exports = router; 