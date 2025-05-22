const Countdown = require('../models/Countdown');

// 获取当前用户所有倒计时
exports.getCountdowns = async (req, res) => {
  try {
    const countdowns = await Countdown.find({ user: req.user.id }).sort({ createdAt: 1 });
    res.json(countdowns);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 新建倒计时
exports.createCountdown = async (req, res) => {
  try {
    const { type, title, targetTime, duration } = req.body;
    const countdown = new Countdown({
      user: req.user.id,
      type,
      title,
      targetTime: targetTime ? new Date(targetTime) : undefined,
      duration,
    });
    await countdown.save();
    res.status(201).json(countdown);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 更新倒计时
exports.updateCountdown = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, targetTime, duration } = req.body;
    const countdown = await Countdown.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { type, title, targetTime, duration } },
      { new: true }
    );
    if (!countdown) return res.status(404).json({ message: 'Countdown not found' });
    res.json(countdown);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 删除倒计时
exports.deleteCountdown = async (req, res) => {
  try {
    const { id } = req.params;
    const countdown = await Countdown.findOneAndDelete({ _id: id, user: req.user.id });
    if (!countdown) return res.status(404).json({ message: 'Countdown not found' });
    res.json({ message: 'Countdown deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 