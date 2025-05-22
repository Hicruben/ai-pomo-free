const Pomodoro = require('../models/Pomodoro');
const Stats = require('../models/Stats');

// Aggregate pomodoro data for the current user
exports.aggregatePomodoros = async (req, res) => {
  try {
    // Get all pomodoros for the current user
    const pomodoros = await Pomodoro.find({
      user: req.user.id,
      completed: true
    });

    console.log(`Found ${pomodoros.length} completed pomodoros for user ${req.user.id}`);

    // Group pomodoros by date
    const pomodorosByDate = {};
    // Track total duration by date
    const durationsByDate = {};

    // Group pomodoros by UTC date and hour to enable proper timezone conversion
    pomodoros.forEach(pomodoro => {
      // Get the full ISO string with timezone information
      const fullIsoDate = pomodoro.startTime.toISOString();

      // Extract the UTC date part (YYYY-MM-DD)
      const utcDatePart = fullIsoDate.split('T')[0];

      // Extract the hour part for timezone conversion
      const hourPart = fullIsoDate.split('T')[1].split(':')[0];

      // Create a key with date and hour information for precise timezone conversion
      // Format: YYYY-MM-DD:HH (e.g., 2023-05-10:14)
      const dateHourKey = `${utcDatePart}:${hourPart}`;

      // Increment count for this date+hour combination
      if (pomodorosByDate[dateHourKey]) {
        pomodorosByDate[dateHourKey] += 1;
        durationsByDate[dateHourKey] += pomodoro.duration || 25; // Use actual duration or default to 25
      } else {
        pomodorosByDate[dateHourKey] = 1;
        durationsByDate[dateHourKey] = pomodoro.duration || 25; // Use actual duration or default to 25
      }

      console.log(`Added pomodoro for date+hour: ${dateHourKey} (from ${fullIsoDate}) with duration: ${pomodoro.duration} minutes`);
    });

    console.log('Aggregated pomodoros by date+hour:', pomodorosByDate);
    console.log('Aggregated durations by date+hour:', durationsByDate);
    console.log(`Found pomodoros for ${Object.keys(pomodorosByDate).length} different date+hour combinations`);

    // Find or create stats for the user
    let stats = await Stats.findOne({ user: req.user.id });

    if (!stats) {
      stats = new Stats({
        user: req.user.id,
      });
    }

    // Update stats with aggregated data
    stats.pomodorosByDate = pomodorosByDate;
    stats.durationsByDate = durationsByDate; // Store durations by date
    stats.totalPomodoros = pomodoros.length;

    // Calculate total duration across all pomodoros
    stats.totalDuration = pomodoros.reduce((total, pomodoro) => total + (pomodoro.duration || 25), 0);

    // Calculate max pomodoros in a day
    // We need to first aggregate by day in local timezone, but we'll do this on the client side
    // For now, just use the maximum count for any date+hour combination
    stats.maxPomodorosInDay = Math.max(
      stats.maxPomodorosInDay || 0,
      ...Object.values(pomodorosByDate)
    );

    // Save stats
    await stats.save();

    res.json({
      message: 'Pomodoro data aggregated successfully',
      stats: {
        totalPomodoros: stats.totalPomodoros,
        totalDuration: stats.totalDuration,
        maxPomodorosInDay: stats.maxPomodorosInDay,
        dateCount: Object.keys(pomodorosByDate).length,
        pomodorosByDate,
        durationsByDate
      }
    });
  } catch (err) {
    console.error('Error aggregating pomodoros:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
