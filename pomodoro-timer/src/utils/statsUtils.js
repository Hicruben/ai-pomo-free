// Format a date as YYYY-MM-DD in the client's local timezone
export const formatDateToLocalTimezone = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert a UTC date string to local timezone date string
export const convertUTCToLocalDate = (utcDateString) => {
  // Check if the string is in our special date+hour format (YYYY-MM-DD:HH)
  if (utcDateString.includes(':') && !utcDateString.includes('T')) {
    // Split into date and hour parts
    const [datePart, hourPart] = utcDateString.split(':');

    // Create a date object with the UTC time
    const utcDate = new Date(`${datePart}T${hourPart}:00:00Z`);

    // Format in local timezone
    return formatDateToLocalTimezone(utcDate);
  }

  // If the date string doesn't include time information, assume it's a date-only string
  if (!utcDateString.includes('T')) {
    // For date-only strings, create a date at 00:00:00 UTC
    const utcDate = new Date(`${utcDateString}T00:00:00Z`);
    return formatDateToLocalTimezone(utcDate);
  }

  // For full ISO strings, just create a date object which will convert to local time
  const localDate = new Date(utcDateString);
  return formatDateToLocalTimezone(localDate);
};

// Get today's date in YYYY-MM-DD format in the client's local timezone
export const getTodayDateString = () => {
  const today = new Date();
  return formatDateToLocalTimezone(today);
};

// Get yesterday's date in YYYY-MM-DD format in the client's local timezone
export const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToLocalTimezone(yesterday);
};

// Get date for a specific day in the past (days ago) in the client's local timezone
export const getDateStringDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateToLocalTimezone(date);
};

// Get the start of the current week (Sunday) in the client's local timezone
export const getStartOfWeekDateString = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - day;
  const startOfWeek = new Date(today.setDate(diff));
  return formatDateToLocalTimezone(startOfWeek);
};

// Get the start of the current month in the client's local timezone
export const getStartOfMonthDateString = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatDateToLocalTimezone(startOfMonth);
};

// Calculate streak days
export const calculateStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) {
    return 0;
  }

  // Sort dates in descending order (newest first)
  const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));

  // Check if today has completions
  const today = getTodayDateString();
  const hasTodayCompletions = sortedDates.includes(today);

  if (!hasTodayCompletions) {
    // Check if yesterday has completions
    const yesterday = getYesterdayDateString();
    const hasYesterdayCompletions = sortedDates.includes(yesterday);

    if (!hasYesterdayCompletions) {
      return 0; // Streak broken
    }
  }

  // Count consecutive days
  let streak = hasTodayCompletions ? 1 : 0;
  let currentDate = hasTodayCompletions ? today : getYesterdayDateString();

  while (true) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateString = formatDateToLocalTimezone(prevDate);

    if (sortedDates.includes(prevDateString)) {
      streak++;
      currentDate = prevDateString;
    } else {
      break;
    }
  }

  return streak;
};

// Calculate points for a completed pomodoro
export const calculatePomodoroPoints = (isUninterrupted = true) => {
  // Base points for completing a pomodoro
  const basePoints = 10;

  // Bonus for completing without interruption (no pauses)
  const uninterruptedBonus = isUninterrupted ? 5 : 0;

  return basePoints + uninterruptedBonus;
};

// Calculate streak bonus points
export const calculateStreakBonus = (streakDays) => {
  // Bonus points for maintaining a streak
  if (streakDays >= 30) {
    return 50; // Monthly streak
  } else if (streakDays >= 7) {
    return 20; // Weekly streak
  } else if (streakDays >= 3) {
    return 10; // Few days streak
  }
  return 0;
};

// Define achievements
export const achievements = [
  {
    id: 'first_pomodoro',
    name: 'First Focus',
    description: 'Complete your first Pomodoro',
    condition: (stats) => stats.totalPomodoros >= 1,
    icon: '🍅',
  },
  {
    id: 'pomodoro_master',
    name: 'Pomodoro Master',
    description: 'Complete 100 Pomodoros',
    condition: (stats) => stats.totalPomodoros >= 100,
    icon: '🏆',
  },
  {
    id: 'daily_five',
    name: 'High Five',
    description: 'Complete 5 Pomodoros in a single day',
    condition: (stats) => stats.maxPomodorosInDay >= 5,
    icon: '✋',
  },
  {
    id: 'weekly_streak',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    condition: (stats) => stats.longestStreak >= 7,
    icon: '🔥',
  },
  {
    id: 'monthly_streak',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    condition: (stats) => stats.longestStreak >= 30,
    icon: '🌟',
  },
  {
    id: 'task_completer',
    name: 'Task Terminator',
    description: 'Complete 10 tasks',
    condition: (stats) => stats.completedTasks >= 10,
    icon: '✅',
  },
];

// Check for newly unlocked achievements
export const checkNewAchievements = (stats, unlockedAchievements) => {
  const newlyUnlocked = [];

  achievements.forEach(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.id);
    const shouldUnlock = achievement.condition(stats);

    if (!isUnlocked && shouldUnlock) {
      newlyUnlocked.push(achievement.id);
    }
  });

  return newlyUnlocked;
};

// Get achievement details by ID
export const getAchievementById = (achievementId) => {
  return achievements.find(a => a.id === achievementId);
};

// Calculate level based on experience points
export const calculateLevel = (experiencePoints) => {
  // Simple level calculation: level = sqrt(xp / 100) + 1
  return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
};

// Calculate experience needed for next level
export const experienceForNextLevel = (currentLevel) => {
  return 100 * Math.pow(currentLevel, 2);
};

// Calculate progress percentage to next level
export const levelProgressPercentage = (experiencePoints) => {
  const currentLevel = calculateLevel(experiencePoints);
  const currentLevelXP = 100 * Math.pow(currentLevel - 1, 2);
  const nextLevelXP = 100 * Math.pow(currentLevel, 2);

  const xpInCurrentLevel = experiencePoints - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  return (xpInCurrentLevel / xpNeededForNextLevel) * 100;
};

// Process pomodoro data by converting UTC dates to local timezone dates
export const processPomodoroDataWithTimezone = (pomodorosByDate) => {
  const processedData = {};

  // Get the user's timezone offset in hours
  const timezoneOffset = -new Date().getTimezoneOffset() / 60;
  console.log(`Processing pomodoro data with timezone offset: UTC${timezoneOffset >= 0 ? '+' + timezoneOffset : timezoneOffset}`);

  // Handle both Map and plain object formats
  if (pomodorosByDate instanceof Map) {
    // If it's a Map, iterate through entries
    pomodorosByDate.forEach((count, dateStr) => {
      const localDateStr = convertUTCToLocalDate(dateStr);
      processedData[localDateStr] = (processedData[localDateStr] || 0) + count;
      console.log(`Converted ${dateStr} to ${localDateStr} with count ${count}`);
    });
  } else if (typeof pomodorosByDate === 'object' && pomodorosByDate !== null) {
    // If it's a plain object, use Object.entries
    Object.entries(pomodorosByDate).forEach(([dateStr, count]) => {
      const localDateStr = convertUTCToLocalDate(dateStr);
      processedData[localDateStr] = (processedData[localDateStr] || 0) + count;
      console.log(`Converted ${dateStr} to ${localDateStr} with count ${count}`);
    });
  }

  // Log the final processed data
  console.log('Final processed pomodoro data by local date:');
  Object.entries(processedData).forEach(([date, count]) => {
    console.log(`${date}: ${count} pomodoros`);
  });

  return processedData;
};

// Process duration data by converting UTC dates to local timezone dates
export const processDurationsWithTimezone = (durationsByDate) => {
  const processedData = {};

  // Get the user's timezone offset in hours
  const timezoneOffset = -new Date().getTimezoneOffset() / 60;
  console.log(`Processing duration data with timezone offset: UTC${timezoneOffset >= 0 ? '+' + timezoneOffset : timezoneOffset}`);

  // Handle both Map and plain object formats
  if (durationsByDate instanceof Map) {
    // If it's a Map, iterate through entries
    durationsByDate.forEach((duration, dateStr) => {
      const localDateStr = convertUTCToLocalDate(dateStr);
      processedData[localDateStr] = (processedData[localDateStr] || 0) + duration;
      console.log(`Converted ${dateStr} to ${localDateStr} with duration ${duration}`);
    });
  } else if (typeof durationsByDate === 'object' && durationsByDate !== null) {
    // If it's a plain object, use Object.entries
    Object.entries(durationsByDate).forEach(([dateStr, duration]) => {
      const localDateStr = convertUTCToLocalDate(dateStr);
      processedData[localDateStr] = (processedData[localDateStr] || 0) + duration;
      console.log(`Converted ${dateStr} to ${localDateStr} with duration ${duration}`);
    });
  }

  // Log the final processed data
  console.log('Final processed duration data by local date:');
  Object.entries(processedData).forEach(([date, duration]) => {
    console.log(`${date}: ${duration} minutes`);
  });

  return processedData;
};
