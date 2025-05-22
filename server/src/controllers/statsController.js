const Stats = require('../models/Stats');

// Get stats for the current user
exports.getStats = async (req, res) => {
  try {
    // Find or create stats
    let stats = await Stats.findOne({ user: req.user.id });

    if (!stats) {
      stats = new Stats({
        user: req.user.id,
      });
      await stats.save();
    }

    // Debug information about pomodorosByDate
    console.log('=== GETTING STATS FOR USER ===');
    console.log('Stats found for user:', req.user.id);
    console.log('pomodorosByDate type:', typeof stats.pomodorosByDate);
    console.log('pomodorosByDate instanceof Map:', stats.pomodorosByDate instanceof Map);

    // Log the raw pomodorosByDate
    console.log('Raw pomodorosByDate:', stats.pomodorosByDate);

    // Try to log the keys and values
    if (stats.pomodorosByDate instanceof Map) {
      console.log('Map keys:', Array.from(stats.pomodorosByDate.keys()));
      console.log('Map entries:', Array.from(stats.pomodorosByDate.entries()));
    } else if (typeof stats.pomodorosByDate === 'object') {
      console.log('Object keys:', Object.keys(stats.pomodorosByDate));
      console.log('Object entries:', Object.entries(stats.pomodorosByDate));
    }

    // IMPORTANT: We need to convert the Map to a plain object BEFORE calling toObject()
    // This is because toObject() doesn't properly serialize Map objects

    // Create plain objects to hold the converted data
    const pomodorosObj = {};
    const durationsObj = {};

    console.log('Converting pomodorosByDate to plain object for client');
    console.log('Raw pomodorosByDate:', stats.pomodorosByDate);
    console.log('Raw durationsByDate:', stats.durationsByDate);

    try {
      // Check if pomodorosByDate is a Map instance
      if (stats.pomodorosByDate instanceof Map) {
        console.log('pomodorosByDate is a Map instance');

        // Get all keys from the Map
        const keys = Array.from(stats.pomodorosByDate.keys());
        console.log('Map keys:', keys);

        // Convert each key-value pair to the plain object
        keys.forEach(key => {
          const value = stats.pomodorosByDate.get(key);
          pomodorosObj[key] = value;
          console.log(`Added key "${key}" with value ${value} to pomodorosObj`);
        });
      } else {
        console.log('pomodorosByDate is not a Map instance, type:', typeof stats.pomodorosByDate);

        // If it's already an object with date keys, use it directly
        if (typeof stats.pomodorosByDate === 'object' && stats.pomodorosByDate !== null) {
          // Check for direct date keys (YYYY-MM-DD format)
          const dateKeys = Object.keys(stats.pomodorosByDate).filter(key =>
            key.match(/^\d{4}-\d{2}-\d{2}$/)
          );

          if (dateKeys.length > 0) {
            console.log('Found date keys in pomodorosByDate:', dateKeys);
            dateKeys.forEach(key => {
              pomodorosObj[key] = stats.pomodorosByDate[key];
              console.log(`Added date key "${key}" with value ${stats.pomodorosByDate[key]} to pomodorosObj`);
            });
          } else {
            // Check for MongoDB's internal Map representation
            console.log('Checking for MongoDB Map format...');

            // Try different approaches to extract the data

            // Approach 1: Check for _ksi_ keys (MongoDB Map format)
            const ksiKeys = Object.keys(stats.pomodorosByDate).filter(key =>
              key.startsWith('_ksi_')
            );

            if (ksiKeys.length > 0) {
              console.log('Found _ksi_ keys in pomodorosByDate:', ksiKeys);

              ksiKeys.forEach(key => {
                const entry = stats.pomodorosByDate[key];
                if (Array.isArray(entry) && entry.length === 2) {
                  const [mapKey, mapValue] = entry;
                  pomodorosObj[mapKey] = mapValue;
                  console.log(`Added key "${mapKey}" with value ${mapValue} to pomodorosObj from _ksi_ format`);
                }
              });
            }

            // Approach 2: Check if it has a 'data' property that's an array of entries
            else if (stats.pomodorosByDate.data && Array.isArray(stats.pomodorosByDate.data)) {
              console.log('Found data array in pomodorosByDate:', stats.pomodorosByDate.data);

              stats.pomodorosByDate.data.forEach(entry => {
                if (Array.isArray(entry) && entry.length === 2) {
                  const [mapKey, mapValue] = entry;
                  pomodorosObj[mapKey] = mapValue;
                  console.log(`Added key "${mapKey}" with value ${mapValue} to pomodorosObj from data array`);
                }
              });
            }

            // Approach 3: If it's a string, try to parse it
            else if (typeof stats.pomodorosByDate === 'string') {
              try {
                const parsed = JSON.parse(stats.pomodorosByDate);
                console.log('Parsed pomodorosByDate from string:', parsed);

                if (typeof parsed === 'object' && parsed !== null) {
                  Object.keys(parsed).forEach(key => {
                    if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      pomodorosObj[key] = parsed[key];
                      console.log(`Added key "${key}" with value ${parsed[key]} to pomodorosObj from parsed string`);
                    }
                  });
                }
              } catch (parseError) {
                console.error('Error parsing pomodorosByDate string:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error converting pomodorosByDate:', error);
    }

    // Process durationsByDate similar to pomodorosByDate
    try {
      // Check if durationsByDate is a Map instance
      if (stats.durationsByDate instanceof Map) {
        console.log('durationsByDate is a Map instance');

        // Get all keys from the Map
        const keys = Array.from(stats.durationsByDate.keys());
        console.log('Duration Map keys:', keys);

        // Convert each key-value pair to the plain object
        keys.forEach(key => {
          const value = stats.durationsByDate.get(key);
          durationsObj[key] = value;
          console.log(`Added duration key "${key}" with value ${value} to durationsObj`);
        });
      } else {
        console.log('durationsByDate is not a Map instance, type:', typeof stats.durationsByDate);

        // If it's already an object with date keys, use it directly
        if (typeof stats.durationsByDate === 'object' && stats.durationsByDate !== null) {
          // Check for direct date keys (YYYY-MM-DD format)
          const dateKeys = Object.keys(stats.durationsByDate).filter(key =>
            key.match(/^\d{4}-\d{2}-\d{2}$/)
          );

          if (dateKeys.length > 0) {
            console.log('Found date keys in durationsByDate:', dateKeys);
            dateKeys.forEach(key => {
              durationsObj[key] = stats.durationsByDate[key];
              console.log(`Added date key "${key}" with value ${stats.durationsByDate[key]} to durationsObj`);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error converting durationsByDate:', error);
    }

    // Log the result of our conversion
    console.log('Final pomodorosObj:', pomodorosObj);
    console.log('Keys in pomodorosObj:', Object.keys(pomodorosObj));
    console.log('Final durationsObj:', durationsObj);
    console.log('Keys in durationsObj:', Object.keys(durationsObj));

    // CRITICAL: Always replace the Map with our plain object BEFORE calling toObject()
    // This ensures we always have a plain object, even if the conversion failed

    // Make a deep copy of the stats object
    const statsCopy = stats.toObject();

    // Replace the pomodorosByDate and durationsByDate with our plain objects
    statsCopy.pomodorosByDate = pomodorosObj;
    statsCopy.durationsByDate = durationsObj;

    // Log the final result
    console.log('Final pomodorosByDate object:', statsCopy.pomodorosByDate);
    console.log('Keys in final object:', Object.keys(statsCopy.pomodorosByDate));

    // Log each key and value for debugging
    Object.keys(statsCopy.pomodorosByDate).forEach(key => {
      console.log(`Key: "${key}" (${typeof key}), Value: ${statsCopy.pomodorosByDate[key]}`);
    });

    // Log today's count for debugging
    const today = new Date().toISOString().split('T')[0];
    console.log(`Final today's (${today}) count:`, statsCopy.pomodorosByDate[today] || 0);

    res.json(statsCopy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update achievements
exports.updateAchievements = async (req, res) => {
  try {
    const { achievements } = req.body;

    if (!Array.isArray(achievements)) {
      return res.status(400).json({ message: 'Achievements must be an array' });
    }

    // Find stats
    const stats = await Stats.findOne({ user: req.user.id });

    if (!stats) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    // Update achievements
    stats.unlockedAchievements = Array.from(
      new Set([...stats.unlockedAchievements, ...achievements])
    );

    await stats.save();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
