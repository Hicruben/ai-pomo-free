const Reminder = require('../models/Reminder');

// 获取当前用户所有提醒
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ time: 1, createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 新建提醒
exports.createReminder = async (req, res) => {
  try {
    const { text, time } = req.body;
    const reminder = new Reminder({
      user: req.user.id,
      text,
      time: time ? new Date(time) : undefined,
      triggered: false,
    });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 更新提醒（如标记已触发）
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, time, triggered } = req.body;
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { text, time, triggered } },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 删除提醒
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findOneAndDelete({ _id: id, user: req.user.id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 