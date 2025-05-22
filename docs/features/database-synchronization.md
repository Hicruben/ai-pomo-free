# Database Synchronization

## Overview
This document outlines how the application synchronizes data with the database when a user is logged in. The synchronization primarily focuses on pomodoro timer data and task progress.

## Data Points Synchronized
1. Pomodoro Records
   - Created when a work session is completed
   - Contains: taskId, projectId, startTime, endTime, duration, completed status
   - Stored in the `pomodoros` collection

2. Task Progress
   - Updated when a pomodoro is completed
   - Tracks actual pomodoros completed
   - Stored in the `tasks` collection

3. User Stats
   - Updated with each completed pomodoro
   - Includes: total pomodoros, daily counts, experience points
   - Stored in the `stats` collection

## Implementation Details

### Timer Context
The `TimerContext` handles the core synchronization logic:
```javascript
// In handleSessionCompletion
if (prevState.currentSession === 'work' && isAuthenticated()) {
  try {
    await pomodoroApi.createPomodoro({
      taskId: prevState.taskId,
      projectId: prevState.projectId,
      startTime: new Date(Date.now() - settings.workTime * 60 * 1000),
      endTime: new Date(),
      duration: settings.workTime,
      completed: true,
      interrupted: false
    });
  } catch (error) {
    console.error('Error saving pomodoro:', error);
  }
}
```

### Timer Component
The `Timer` component handles task-specific synchronization:
```javascript
// In pomodoro completion effect
if (isAuthenticated()) {
  try {
    pomodoroApi.createPomodoro({...})
      .then(() => {
        if (isAuthenticated()) {
          taskApi.updateTask(activeTask.id, {
            completedPomodoros: (activeTask.completedPomodoros || 0) + 1
          });
        }
      });
  } catch (error) {
    console.error('Error in pomodoro completion:', error);
  }
}
```

## Error Handling
1. Database Errors
   - All database operations are wrapped in try-catch blocks
   - Errors are logged to console
   - Local state updates still occur even if database operations fail

2. Authentication State
   - All database operations check authentication status
   - Operations are skipped if user is not authenticated
   - Local storage is used as fallback

## Best Practices
1. Always check authentication status before database operations
2. Use local storage as fallback for unauthenticated users
3. Maintain data consistency between local and database state
4. Handle errors gracefully without blocking user experience
5. Log all database operations and errors for debugging 