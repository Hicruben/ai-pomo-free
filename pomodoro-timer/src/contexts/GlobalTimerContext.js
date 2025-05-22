import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { isAuthenticated } from '../services/authService';
import { pomodoroApi, settingsApi } from '../services/apiService';
import { playSound } from '../utils/audioUtils';
import eventBus from '../utils/eventBus';

// Create the context
const GlobalTimerContext = createContext();

// Custom hook to use the timer context
export const useGlobalTimer = () => useContext(GlobalTimerContext);

// Default settings if context fails
const DEFAULT_TIMER_SETTINGS = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartNextSession: false,
  tickingSound: false,
  completionSound: true,
  notifications: true,
  volume: 50,
  selectedSound: 'completion',
};

// Provider component
export const GlobalTimerProvider = ({ children }) => {
  // Get settings from context
  const settingsContext = useSettings();
  const settings = settingsContext?.settings || DEFAULT_TIMER_SETTINGS;

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(() => settings.workTime * 60); // Initialize with settings
  const [timeRemaining, setTimeRemaining] = useState(() => settings.workTime * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState(null);
  const [onCompleteCallback, setOnCompleteCallback] = useState(null);
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  // Session state
  const [currentSession, setCurrentSession] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [projectId, setProjectId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());

  // Update timer when settings change
  useEffect(() => {
    console.log('Timer settings loaded or changed:', settings);

    // Only update if settings have changed and timer is not running
    if (!isRunning && !isPaused) {
      // Calculate new duration based on current session
      let newDuration;
      switch (currentSession) {
        case 'work':
          newDuration = settings.workTime * 60;
          break;
        case 'shortBreak':
          newDuration = settings.shortBreakTime * 60;
          break;
        case 'longBreak':
          newDuration = settings.longBreakTime * 60;
          break;
        default:
          newDuration = settings.workTime * 60;
      }

      console.log(`Updating timer duration to ${newDuration} seconds based on settings`);
      setTimeRemaining(newDuration);
      setSettingsInitialized(true);

      // Dispatch an event to notify other components that the timer has been updated
      const event = new CustomEvent('timerUpdated', {
        detail: {
          session: currentSession,
          duration: newDuration,
          settings
        }
      });
      window.dispatchEvent(event);
    }
  }, [settings, isRunning, isPaused, currentSession]);

  // Listen for settings changes from other components
  useEffect(() => {
    const handleSettingsChange = (event) => {
      console.log('GlobalTimerContext: Detected settings change event:', event.detail.settings);

      // If timer is not running, update the time remaining based on new settings
      if (!isRunning && !isPaused && currentSession) {
        // Get the new settings
        const newSettings = event.detail.settings;

        // Calculate new duration based on session type
        let newDuration;
        switch (currentSession) {
          case 'work':
            newDuration = newSettings.workTime * 60;
            break;
          case 'shortBreak':
            newDuration = newSettings.shortBreakTime * 60;
            break;
          case 'longBreak':
            newDuration = newSettings.longBreakTime * 60;
            break;
          default:
            newDuration = newSettings.workTime * 60;
        }

        console.log(`GlobalTimerContext: Updating timer duration to ${newDuration} seconds based on new settings`);
        setTimeRemaining(newDuration);
      }
    };

    // Handle force timer refresh event
    const handleForceTimerRefresh = (event) => {
      console.log('GlobalTimerContext: Detected forceTimerRefresh event:', event.detail);

      // Only update if timer is not running
      if (!isRunning && !isPaused) {
        const { session, duration } = event.detail;

        // Update time remaining
        console.log(`GlobalTimerContext: Force updating timer duration to ${duration} seconds`);
        setTimeRemaining(duration);
      }
    };

    // Add event listeners
    window.addEventListener('settingsChanged', handleSettingsChange);
    window.addEventListener('forceTimerRefresh', handleForceTimerRefresh);

    // Clean up
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
      window.removeEventListener('forceTimerRefresh', handleForceTimerRefresh);
    };
  }, [isRunning, isPaused, currentSession]);

  // Timer interval reference
  const timerIntervalRef = useRef(null);

  // Load timer state from server or localStorage on component mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        if (isAuthenticated()) {
          console.log('Loading timer state from server...');
          // Try to load timer state from server
          const response = await fetch('/active-timer', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Server timer state:', data);

            if (data) {
              // Calculate current time remaining based on lastUpdatedTime
              const now = Date.now();
              const lastUpdated = new Date(data.lastUpdatedTime).getTime();
              const elapsed = now - lastUpdated;
              const remaining = Math.max(0, data.timeRemaining * 1000 - elapsed);
              const secondsRemaining = Math.ceil(remaining / 1000);

              // Get session times from the server data or fall back to settings
              const sessionTimes = data.sessionTimes || {
                workTime: settings.workTime,
                shortBreakTime: settings.shortBreakTime,
                longBreakTime: settings.longBreakTime
              };

              console.log('Using session times from server:', sessionTimes);

              // Always load session and pomodoro count
              setCurrentSession(data.currentSession);
              setPomodoroCount(data.pomodoroCount);

              // Only set project and task IDs for work sessions
              if (data.currentSession === 'work') {
                setProjectId(data.projectId);
                setTaskId(data.taskId);
              } else {
                setProjectId(null);
                setTaskId(null);
              }

              setTimeRemaining(secondsRemaining);
              setIsRunning(data.isRunning);
              setIsPaused(data.isPaused);
              setLastUpdatedTime(lastUpdated);

              if (data.isRunning) {
                setStartTime(now - (data.timeRemaining * 1000 - remaining));
                setDuration(data.timeRemaining * 1000);
              } else if (data.isPaused) {
                setPausedTimeRemaining(secondsRemaining);
              }

              return; // Successfully loaded from server
            }
          }
        }

        // Fall back to localStorage if not authenticated or no server data
        const storedStartTime = localStorage.getItem('simpleTimer_startTime');
        const storedDuration = localStorage.getItem('simpleTimer_duration');
        const storedIsRunning = localStorage.getItem('simpleTimer_isRunning');
        const storedPausedTimeRemaining = localStorage.getItem('simpleTimer_pausedTimeRemaining');
        const storedSession = localStorage.getItem('simpleTimer_session');
        const storedPomodoroCount = localStorage.getItem('simpleTimer_pomodoroCount');
        const storedProjectId = localStorage.getItem('simpleTimer_projectId');
        const storedTaskId = localStorage.getItem('simpleTimer_taskId');

        // Always load session and pomodoro count if available
        if (storedSession) {
          console.log(`Loading session from localStorage: ${storedSession}`);
          setCurrentSession(storedSession);

          // Only set project and task IDs for work sessions
          if (storedSession === 'work') {
            if (storedProjectId) {
              console.log(`Loading project ID from localStorage: ${storedProjectId}`);
              setProjectId(storedProjectId);
            }
            if (storedTaskId) {
              console.log(`Loading task ID from localStorage: ${storedTaskId}`);
              setTaskId(storedTaskId);
            }
          } else {
            // For break sessions, clear project and task IDs
            console.log('Break session detected, clearing project and task IDs');
            setProjectId(null);
            setTaskId(null);
          }
        }

        if (storedPomodoroCount) {
          const parsedCount = parseInt(storedPomodoroCount, 10);
          console.log(`Loading pomodoro count from localStorage: ${parsedCount}`);
          setPomodoroCount(parsedCount);
        }

        // Load running timer state
        if (storedStartTime && storedDuration && storedIsRunning) {
          const parsedStartTime = parseInt(storedStartTime, 10);
          const parsedDuration = parseInt(storedDuration, 10);

          // Calculate current time remaining
          const now = Date.now();
          const elapsed = now - parsedStartTime;
          const remaining = Math.max(0, parsedDuration - elapsed);
          const secondsRemaining = Math.ceil(remaining / 1000);

          console.log(`Loading running timer from localStorage: ${secondsRemaining} seconds remaining`);

          setStartTime(parsedStartTime);
          setDuration(parsedDuration);
          setTimeRemaining(secondsRemaining);
          setIsRunning(true);
        }
        // Load paused timer state
        else if (storedPausedTimeRemaining) {
          const parsedTimeRemaining = parseInt(storedPausedTimeRemaining, 10);
          console.log(`Loading paused timer from localStorage: ${parsedTimeRemaining} seconds remaining`);

          setPausedTimeRemaining(parsedTimeRemaining);
          setIsPaused(true);
          setTimeRemaining(parsedTimeRemaining);
        }
        // Set initial time remaining based on current session
        else if (storedSession) {
          // Get duration for the current session
          const sessionDuration = getSessionDuration(storedSession);
          console.log(`Setting initial time remaining for ${storedSession}: ${sessionDuration} seconds`);
          setTimeRemaining(sessionDuration);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    loadTimerState();
  }, []);

  // Update timer state in server and localStorage
  useEffect(() => {
    const updateTimerState = async () => {
      try {
        // Always save the current session and pomodoro count to localStorage
        localStorage.setItem('simpleTimer_session', currentSession);
        localStorage.setItem('simpleTimer_pomodoroCount', pomodoroCount.toString());

        // Update localStorage for running timer
        if (isRunning && startTime && duration) {
          localStorage.setItem('simpleTimer_startTime', startTime.toString());
          localStorage.setItem('simpleTimer_duration', duration.toString());
          localStorage.setItem('simpleTimer_isRunning', 'true');
          if (projectId) localStorage.setItem('simpleTimer_projectId', projectId);
          if (taskId) localStorage.setItem('simpleTimer_taskId', taskId);
        } else {
          localStorage.removeItem('simpleTimer_startTime');
          localStorage.removeItem('simpleTimer_duration');
          localStorage.removeItem('simpleTimer_isRunning');
        }

        // Update localStorage for paused timer
        if (isPaused && pausedTimeRemaining) {
          localStorage.setItem('simpleTimer_pausedTimeRemaining', pausedTimeRemaining.toString());
          if (projectId) localStorage.setItem('simpleTimer_projectId', projectId);
          if (taskId) localStorage.setItem('simpleTimer_taskId', taskId);
        } else {
          localStorage.removeItem('simpleTimer_pausedTimeRemaining');
        }

        // Set global timer state for other components to access
        window.globalTimerState = {
          isRunning,
          isPaused,
          currentSession,
          timeRemaining,
          pomodoroCount,
          projectId,
          taskId,
          isStandalone: !projectId, // If no projectId, it's a standalone timer
          lastUpdatedTime: Date.now()
        };

        console.log('GlobalTimerContext: Updated global timer state:', window.globalTimerState);

        // Update server if authenticated
        if (isAuthenticated()) {
          const now = Date.now();
          setLastUpdatedTime(now);

          // Always use the latest settings from context
          const currentSettings = settingsContext?.settings || settings;
          console.log('Updating timer state on server with settings:', currentSettings);

          // Always save the current session and pomodoro count to the server
          const timerData = {
            isRunning,
            isPaused,
            currentSession,
            timeRemaining,
            pomodoroCount,
            projectId: currentSession === 'work' ? projectId : null,
            taskId: currentSession === 'work' ? taskId : null,
            lastUpdatedTime: now,
            sessionTimes: {
              workTime: currentSettings.workTime,
              shortBreakTime: currentSettings.shortBreakTime,
              longBreakTime: currentSettings.longBreakTime
            }
          };

          console.log('Sending timer data to server:', timerData);

          try {
            const response = await fetch('/active-timer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(timerData)
            });

            if (!response.ok) {
              console.error('Error updating timer state on server:', response.status, response.statusText);
            }
          } catch (serverError) {
            console.error('Error sending timer data to server:', serverError);
          }
        }
      } catch (error) {
        console.error('Error updating timer state:', error);
      }
    };

    updateTimerState();
  }, [isRunning, startTime, duration, isPaused, pausedTimeRemaining, currentSession, pomodoroCount, projectId, taskId, settings]);

  // Timer tick effect
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isRunning && startTime) {
      // Expected time for next tick (for drift compensation)
      let expectedTime = Date.now() + 1000;

      // Set up interval to update time remaining
      timerIntervalRef.current = setInterval(() => {
        // Calculate elapsed time
        const now = Date.now();
        const drift = now - expectedTime;
        const elapsed = now - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const secondsRemaining = Math.ceil(remaining / 1000);

        // Update time remaining
        setTimeRemaining(secondsRemaining);

        // Check if timer is complete
        if (secondsRemaining <= 0) {
          // Clear interval
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;

          // Reset timer state
          setIsRunning(false);
          setStartTime(null);

          // Clear localStorage
          localStorage.removeItem('simpleTimer_startTime');
          localStorage.removeItem('simpleTimer_duration');
          localStorage.removeItem('simpleTimer_isRunning');

          // Handle session completion
          handleSessionComplete();
        }

        // Calculate the next expected tick time, accounting for drift
        expectedTime += 1000;

        // If we've drifted too much, reset the expected time
        if (drift > 1000) {
          expectedTime = now + 1000;
        }
      }, 1000); // Update every second for accurate countdown
    }

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, startTime, duration]);

  // Handle session completion
  const handleSessionComplete = async (wasInterrupted = false) => {
    try {
      // Play completion sound if enabled
      if (settings.completionSound) {
        console.log('Playing completion sound...');
        playSound('completion', settings.volume / 100);
      }

      // Show browser notification if enabled
      console.log('Attempting to show browser notification');
      console.log('Notification settings:', settings.notifications);
      console.log('Notification available:', 'Notification' in window);
      console.log('Notification permission:', Notification.permission);

      // First, request notification permission if not granted yet
      if (settings.notifications && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          console.log('Requesting notification permission');
          try {
            await Notification.requestPermission();
            console.log('Notification permission response:', Notification.permission);
          } catch (permError) {
            console.error('Error requesting notification permission:', permError);
          }
        }

        // Now check if we have permission and show notification
        if (Notification.permission === 'granted') {
          const notificationTitle = currentSession === 'work'
            ? 'Focus Session Complete'
            : currentSession === 'shortBreak'
              ? 'Short Break Complete'
              : 'Long Break Complete';

          const notificationBody = currentSession === 'work'
            ? 'Great job! Time for a break.'
            : 'Break time is over. Ready to focus again?';

          console.log('Showing browser notification:', notificationTitle);

          // Use setTimeout to ensure notification is shown after a small delay
          // This can help with browser throttling issues
          setTimeout(() => {
            try {
              const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico',
                requireInteraction: false,
                silent: false
              });

              // Log when notification is shown and closed
              notification.onshow = () => console.log('Notification shown successfully');
              notification.onclick = () => console.log('Notification clicked');
              notification.onclose = () => console.log('Notification closed');
              notification.onerror = (err) => console.error('Notification error:', err);

              console.log('Browser notification created successfully');
            } catch (error) {
              console.error('Error showing browser notification:', error);

              // Fallback to alert if notification fails
              console.log('Using alert as fallback');
              alert(`${notificationTitle}: ${notificationBody}`);
            }
          }, 100);
        } else {
          console.log('Notification permission not granted:', Notification.permission);
        }
      } else {
        console.log('Browser notifications not enabled or not supported');
      }

      // If it was a work session, record the completed pomodoro
      if (currentSession === 'work') {
        // Note: We'll increment the pomodoro count later when determining the next session
        console.log('Work session completed - recording pomodoro');

        // Check if the user is still authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('User token not found during timer completion. User may have been logged out.');

          // Save the timer completion data for potential later sync
          try {
            const pendingPomodoros = JSON.parse(localStorage.getItem('pendingPomodoros') || '[]');
            pendingPomodoros.push({
              session: currentSession,
              taskId: taskId,
              projectId: projectId,
              startTime: sessionStartTime || new Date(Date.now() - duration / 1000),
              endTime: new Date(),
              duration: Math.floor(duration / 60000), // Convert ms to minutes
              completed: true,
              interrupted: Boolean(wasInterrupted),
              isStandalone: !projectId,
              timestamp: Date.now(),
              error: 'Authentication token not found during timer completion'
            });
            localStorage.setItem('pendingPomodoros', JSON.stringify(pendingPomodoros));
            console.log('Saved timer completion data for later sync');

            // Still emit the event for UI updates
            eventBus.emit('pomodoroCompleted', {
              date: new Date(),
              taskId: taskId,
              projectId: projectId,
              isStandalone: !projectId,
              savedLocally: true
            });

            return; // Exit early to prevent API call
          } catch (storageError) {
            console.error('Error saving timer completion data to localStorage:', storageError);
          }
        }

        // Record completed pomodoro in database if authenticated
        if (isAuthenticated()) {
          try {
            // For standalone pomodoros, projectId will be null but taskId might be set (for standalone todo items)
            // For project-based pomodoros, both projectId and taskId should be set
            const isStandalonePomodoro = !projectId;

            if (isStandalonePomodoro) {
              console.log('Recording standalone pomodoro');

              await pomodoroApi.createPomodoro({
                taskId: taskId, // This can be null for completely standalone pomodoros
                startTime: sessionStartTime || new Date(Date.now() - duration / 1000),
                endTime: new Date(),
                duration: Math.floor(duration / 60000), // Convert ms to minutes
                completed: true,
                interrupted: Boolean(wasInterrupted), // Ensure it's a boolean using Boolean constructor
                isStandalone: true // Flag for standalone pomodoros
              });
            } else if (projectId && taskId) {
              // Regular project-based pomodoro
              await pomodoroApi.createPomodoro({
                taskId: taskId,
                projectId: projectId,
                startTime: sessionStartTime || new Date(Date.now() - duration / 1000),
                endTime: new Date(),
                duration: Math.floor(duration / 60000), // Convert ms to minutes
                completed: true,
                interrupted: Boolean(wasInterrupted) // Ensure it's a boolean using Boolean constructor
              });
            }

            console.log('Pomodoro recorded successfully');

            // Emit an event to notify other components that a pomodoro was completed
            console.log('GlobalTimerContext: Emitting pomodoroCompleted event');
            eventBus.emit('pomodoroCompleted', {
              date: new Date(),
              taskId: taskId,
              projectId: projectId,
              isStandalone: !projectId
            });
          } catch (error) {
            console.error('Error saving pomodoro:', error);

            // If we get a 401 error, save the pomodoro data for later sync
            if (error.response && error.response.status === 401) {
              try {
                const pendingPomodoros = JSON.parse(localStorage.getItem('pendingPomodoros') || '[]');
                pendingPomodoros.push({
                  session: currentSession,
                  taskId: taskId,
                  projectId: projectId,
                  startTime: sessionStartTime || new Date(Date.now() - duration / 1000),
                  endTime: new Date(),
                  duration: Math.floor(duration / 60000), // Convert ms to minutes
                  completed: true,
                  interrupted: Boolean(wasInterrupted),
                  isStandalone: !projectId,
                  timestamp: Date.now(),
                  error: 'Authentication error (401) during timer completion'
                });
                localStorage.setItem('pendingPomodoros', JSON.stringify(pendingPomodoros));
                console.log('Saved timer completion data for later sync due to 401 error');
              } catch (storageError) {
                console.error('Error saving timer completion data to localStorage:', storageError);
              }
            }
          }
        } else {
          // Even if not authenticated, emit the event for local storage mode
          console.log('GlobalTimerContext: Emitting pomodoroCompleted event (not authenticated)');
          eventBus.emit('pomodoroCompleted', {
            date: new Date(),
            taskId: taskId,
            projectId: projectId,
            isStandalone: !projectId
          });
        }
      } else {
        // This is a break session, do not record a pomodoro
        console.log(`${currentSession} session completed - NOT recording pomodoro`);
      }

      // Determine next session using latest settings
      // Force a fresh read from the context to ensure we have the latest values
      const currentSettings = settingsContext?.settings || settings;
      let nextSession;

      if (currentSession === 'work') {
        // After work session, check if we need a long break
        const newPomodoroCount = pomodoroCount + 1;
        const longBreakInterval = currentSettings.longBreakInterval || 4;

        // Log current state for debugging
        console.log(`Current pomodoroCount: ${pomodoroCount}`);
        console.log(`New pomodoroCount: ${newPomodoroCount}`);
        console.log(`longBreakInterval: ${longBreakInterval}`);
        console.log(`newPomodoroCount % longBreakInterval = ${newPomodoroCount % longBreakInterval}`);

        // Check if we need a long break
        // We need a long break when the current position in the cycle is equal to longBreakInterval
        // This happens when (pomodoroCount % longBreakInterval) === 0, but only if pomodoroCount > 0
        const currentPositionInCycle = newPomodoroCount === 0 ? 0 : ((newPomodoroCount - 1) % longBreakInterval) + 1;
        const needLongBreak = currentPositionInCycle === longBreakInterval;
        nextSession = needLongBreak ? 'longBreak' : 'shortBreak';

        console.log(`Current position in cycle: ${currentPositionInCycle}, longBreakInterval: ${longBreakInterval}, needLongBreak: ${needLongBreak}`);

        console.log(`Completed pomodoro ${newPomodoroCount}, longBreakInterval: ${longBreakInterval}, needLongBreak: ${needLongBreak}, next session: ${nextSession}`);

        // Update the pomodoro count immediately
        setPomodoroCount(newPomodoroCount);
      } else {
        // After any break, go back to work
        nextSession = 'work';
        console.log(`Completed ${currentSession}, next session: work`);
      }

      // Update session state
      setCurrentSession(nextSession);

      // Reset session start time
      setSessionStartTime(null);

      // Auto-start next session if enabled in settings
      // Force a fresh read from the context to ensure we have the latest values
      const autoStartSettings = settingsContext?.settings || settings;

      if (autoStartSettings.autoStartNextSession) {
        console.log(`Auto-starting next session (${nextSession}) based on settings`);

        // For work sessions, only auto-start if we have project and task, or if it's a standalone timer
        const isStandaloneTimer = !projectId;

        if (nextSession !== 'work' || (projectId && taskId) || isStandaloneTimer) {
          // Get duration for the next session - don't pass a duration to force using the latest settings
          console.log(`Starting next session (${nextSession}) with latest settings`);

          // Start the timer without specifying duration to force using the latest settings
          startTimer(null, null, nextSession, null, null, isStandaloneTimer);
        } else {
          console.log('Cannot auto-start work session without project and task');
        }
      } else {
        console.log('Auto-start is disabled in settings');
      }

      // Call the original onComplete callback if provided
      if (onCompleteCallback) {
        // Pass the session type and wasInterrupted flag
        onCompleteCallback({
          wasInterrupted,
          isNormalCompletion: true,
          currentSession: currentSession, // Pass the current session (work, shortBreak, longBreak)
          taskId: currentSession === 'work' ? taskId : null,
          projectId: currentSession === 'work' ? projectId : null,
          interrupted: Boolean(wasInterrupted) // Add a direct boolean value for the interrupted field
        });
      }
    } catch (error) {
      console.error('Error in session completion:', error);
    }
  };

  // Timer functions
  const startTimer = (initialDuration = null, onComplete = null, sessionType = null, projectIdParam = null, taskIdParam = null, isStandalone = false) => {
    // Record session start time
    const now = Date.now();
    setSessionStartTime(now);

    // Update session type if provided
    const newSession = sessionType || currentSession;
    if (sessionType) {
      setCurrentSession(newSession);
    }

    // For work sessions, project and task IDs are required unless it's a standalone timer
    if ((newSession === 'work') && !isStandalone && !projectIdParam && !taskIdParam && (!projectId || !taskId)) {
      console.warn('Project and task IDs are required for work sessions (unless standalone)');
      return false;
    }

    // Update project and task IDs if provided
    if (projectIdParam) setProjectId(projectIdParam);
    if (taskIdParam) setTaskId(taskIdParam);

    // If this is a standalone timer, clear project ID but keep task ID (for standalone todo items)
    if (isStandalone) {
      setProjectId(null);
      // We keep taskId as it might be a standalone todo item
    }

    // Get the duration from settings if not provided
    let duration;
    if (initialDuration) {
      duration = initialDuration;
    } else {
      // Get duration based on session type
      duration = getSessionDuration(newSession);
    }

    console.log(`Starting timer with duration: ${duration} seconds for session type: ${newSession}${isStandalone ? ' (standalone)' : ''}`);

    // Start the timer
    setStartTime(now);
    setDuration(duration * 1000); // Convert to milliseconds
    setTimeRemaining(duration);
    setIsRunning(true);
    setIsPaused(false);
    setPausedTimeRemaining(null);
    setOnCompleteCallback(() => onComplete);

    // Update the global timer state with the isStandalone flag
    if (window.globalTimerState) {
      window.globalTimerState.isStandalone = isStandalone;
    }

    return true;
  };

  const pauseTimer = () => {
    if (isRunning) {
      setIsPaused(true);
      setIsRunning(false);
      setPausedTimeRemaining(timeRemaining);
    }
  };

  const resumeTimer = () => {
    if (isPaused) {
      const now = Date.now();
      setStartTime(now - (duration - pausedTimeRemaining * 1000));
      setIsRunning(true);
      setIsPaused(false);
      setPausedTimeRemaining(null);
    }
  };

  const resetTimer = () => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setTimeRemaining(Math.floor(duration / 1000));
    setPausedTimeRemaining(null);
    setSessionStartTime(null);

    // Clear timer state from localStorage, but keep session and pomodoro count
    localStorage.removeItem('simpleTimer_startTime');
    localStorage.removeItem('simpleTimer_duration');
    localStorage.removeItem('simpleTimer_isRunning');
    localStorage.removeItem('simpleTimer_pausedTimeRemaining');

    // Note: We intentionally don't remove simpleTimer_session and simpleTimer_pomodoroCount
    // to maintain the session state across page refreshes
  };

  const skipTimer = (onComplete) => {
    // Determine next session using latest settings
    const currentSettings = settingsContext?.settings || settings;
    let nextSession;

    if (currentSession === 'work') {
      // When skipping a work session, we don't increment the pomodoro count
      // Just go to the next break session based on the current count
      const longBreakInterval = currentSettings.longBreakInterval || 4;

      // Log current state for debugging
      console.log(`[skipTimer] Current pomodoroCount: ${pomodoroCount}`);
      console.log(`[skipTimer] longBreakInterval: ${longBreakInterval}`);
      console.log(`[skipTimer] (pomodoroCount + 1) % longBreakInterval = ${(pomodoroCount + 1) % longBreakInterval}`);

      // Check if we need a long break using the same logic as in handleSessionComplete
      const nextPomodoroCount = pomodoroCount + 1; // Simulate the next count for calculation
      const currentPositionInCycle = nextPomodoroCount === 0 ? 0 : ((nextPomodoroCount - 1) % longBreakInterval) + 1;
      const needLongBreak = currentPositionInCycle === longBreakInterval;
      nextSession = needLongBreak ? 'longBreak' : 'shortBreak';

      console.log(`[skipTimer] Current position in cycle: ${currentPositionInCycle}, longBreakInterval: ${longBreakInterval}, needLongBreak: ${needLongBreak}`);

      console.log(`Skipping work session, next: ${nextSession} (longBreakInterval: ${longBreakInterval})`);
    } else {
      // After any break, go back to work
      nextSession = 'work';
      console.log(`Skipping break, next: work session`);
    }

    // Reset the timer
    resetTimer();

    // Update session state
    setCurrentSession(nextSession);

    // Call completion callback with interrupted flag and isSkip flag
    if (onComplete) {
      onComplete({
        wasInterrupted: true,
        isSkip: true,
        interrupted: true // Add a direct boolean value for the interrupted field
      });
    } else if (onCompleteCallback) {
      onCompleteCallback({
        wasInterrupted: true,
        isSkip: true,
        interrupted: true // Add a direct boolean value for the interrupted field
      });
    }

    // Emit an event to notify other components that the timer was skipped
    // This helps update project cards in real-time
    console.log('GlobalTimerContext: Emitting pomodoroCompleted event for skipped timer');
    eventBus.emit('pomodoroCompleted', {
      date: new Date(),
      isSkip: true
    });
  };

  // Get session duration based on type
  const getSessionDuration = (sessionType) => {
    // Always use the latest settings from context
    // Force a fresh read from the context to ensure we have the latest values
    const currentSettings = settingsContext?.settings || settings;

    console.log(`Getting duration for ${sessionType} session with settings:`, currentSettings);

    // Log the actual values we're using
    console.log(`Work time: ${currentSettings.workTime} minutes`);
    console.log(`Short break time: ${currentSettings.shortBreakTime} minutes`);
    console.log(`Long break time: ${currentSettings.longBreakTime} minutes`);

    // Calculate duration in seconds
    let duration;
    switch (sessionType) {
      case 'work':
        duration = currentSettings.workTime * 60;
        break;
      case 'shortBreak':
        duration = currentSettings.shortBreakTime * 60;
        break;
      case 'longBreak':
        duration = currentSettings.longBreakTime * 60;
        break;
      default:
        duration = currentSettings.workTime * 60;
    }

    console.log(`Calculated duration for ${sessionType}: ${duration} seconds`);
    return duration;
  };

  // Handle active task change or clearing
  const handleActiveTaskChange = (newTaskId, newProjectId = null) => {
    console.log(`GlobalTimerContext: Handling active task change to taskId: ${newTaskId}, projectId: ${newProjectId}`);

    // Check if this is actually a change
    if (newTaskId === taskId && (newProjectId === null || newProjectId === projectId)) {
      console.log(`GlobalTimerContext: Task ID and Project ID unchanged, skipping update`);
      return true;
    }

    // Check if we've recently updated the task (within the last 2 seconds)
    if (window.lastTaskChangeTime && (Date.now() - window.lastTaskChangeTime < 2000)) {
      console.log(`GlobalTimerContext: Preventing rapid task changes - last change was ${Date.now() - window.lastTaskChangeTime}ms ago`);
      return false;
    }

    // Set the flag to prevent rapid changes
    window.lastTaskChangeTime = Date.now();

    // Always reset the timer when changing tasks
    resetTimer();

    // Update task and project IDs
    setTaskId(newTaskId);
    if (newProjectId) {
      setProjectId(newProjectId);
    } else if (!newTaskId) {
      // If clearing the task, also clear the project
      setProjectId(null);

      // Also clear the active task in localStorage
      console.log(`GlobalTimerContext: Clearing active task in localStorage`);
      localStorage.removeItem('pomodoroActiveTaskId');
      localStorage.removeItem('activeTaskCache');
    }

    // Always set session to work when changing tasks
    setCurrentSession('work');

    // Reset the time remaining to work session duration
    const workDuration = getSessionDuration('work');
    setTimeRemaining(workDuration);

    console.log(`GlobalTimerContext: Timer reset for task change, new timeRemaining: ${workDuration}`);

    return true;
  };

  // Switch active task with warning
  const switchActiveTask = (newProjectId, newTaskId, newProjectName, newTaskName) => {
    // If timer is running, show warning
    if (isRunning || isPaused) {
      if (!window.confirm(`Switching to task "${newTaskName}" in project "${newProjectName}" will reset your current timer. Are you sure?`)) {
        return false;
      }
    }

    // Use the handleActiveTaskChange function to reset the timer and update task/project
    return handleActiveTaskChange(newTaskId, newProjectId);
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for active task changes
  useEffect(() => {
    const handleActiveTaskChanged = (event) => {
      console.log('GlobalTimerContext: Detected activeTaskChanged event:', event.detail);

      if (event.detail) {
        const { taskId, projectId } = event.detail;

        // Get the current task and project IDs from the component state
        const currentTaskId = taskId;
        const currentProjectId = projectId;

        // Check if this is actually a change - compare with current state
        if (event.detail.taskId === currentTaskId &&
            (event.detail.projectId === null || event.detail.projectId === currentProjectId)) {
          console.log(`GlobalTimerContext: Task ID and Project ID unchanged, skipping update from event`);
          return;
        }

        // Check if we've recently updated the task (within the last 2 seconds)
        if (window.lastTaskChangeTime && (Date.now() - window.lastTaskChangeTime < 2000)) {
          console.log(`GlobalTimerContext: Preventing rapid task changes from event - last change was ${Date.now() - window.lastTaskChangeTime}ms ago`);
          return;
        }

        // The warning dialog is now handled in App.js
        // If we get here, it means the user has confirmed the task change
        console.log('GlobalTimerContext: Task change confirmed, resetting timer');

        // If clearing the task (taskId is null), clear localStorage
        if (!taskId) {
          console.log('GlobalTimerContext: Clearing active task in localStorage from event handler');
          localStorage.removeItem('pomodoroActiveTaskId');
          localStorage.removeItem('activeTaskCache');
        }

        // Proceed with task change in this component
        handleActiveTaskChange(taskId, projectId);
      }
    };

    // Add event listener for active task changes
    window.addEventListener('activeTaskChanged', handleActiveTaskChanged);

    // Clean up
    return () => {
      window.removeEventListener('activeTaskChanged', handleActiveTaskChanged);
    };
  }, [taskId, projectId]);

  // Function to update global timer state
  const updateGlobalTimerState = (newState) => {
    console.log('GlobalTimerContext: updateGlobalTimerState called with:', newState);

    // Update the global timer state
    window.globalTimerState = {
      ...window.globalTimerState,
      ...newState,
      lastUpdatedTime: Date.now()
    };

    console.log('GlobalTimerContext: Updated global timer state:', window.globalTimerState);

    // Also update the component state
    if (newState.isRunning !== undefined) setIsRunning(newState.isRunning);
    if (newState.isPaused !== undefined) setIsPaused(newState.isPaused);
    if (newState.timeRemaining !== undefined) setTimeRemaining(newState.timeRemaining);
    if (newState.currentSession !== undefined) setCurrentSession(newState.currentSession);
    if (newState.pomodoroCount !== undefined) setPomodoroCount(newState.pomodoroCount);
    if (newState.projectId !== undefined) setProjectId(newState.projectId);
    if (newState.taskId !== undefined) setTaskId(newState.taskId);
  };

  // Expose the updateGlobalTimerState function globally
  useEffect(() => {
    window.updateGlobalTimerState = updateGlobalTimerState;

    return () => {
      delete window.updateGlobalTimerState;
    };
  }, []);

    // Function to update document title based on timer state
  const updateDocumentTitle = () => {
    // Format time for display in title
    const formatTimeForTitle = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get session emoji
    const getSessionEmoji = () => {
      switch (currentSession) {
        case 'work':
          return '🍅'; // Tomato emoji for work sessions
        case 'shortBreak':
          return '☕'; // Coffee emoji for short breaks
        case 'longBreak':
          return '🌴'; // Palm tree emoji for long breaks
        default:
          return '🍅';
      }
    };

    // Get session name
    const getSessionName = () => {
      switch (currentSession) {
        case 'work':
          return 'Focus';
        case 'shortBreak':
          return 'Short Break';
        case 'longBreak':
          return 'Long Break';
        default:
          return 'Focus';
      }
    };

    // Store the original title to restore it later
    if (!window.originalDocumentTitle) {
      window.originalDocumentTitle = document.title;
    }

    // Update title if timer is running or paused
    if (isRunning || isPaused) {
      const formattedTime = formatTimeForTitle(timeRemaining);
      const emoji = getSessionEmoji();
      const sessionName = getSessionName();
      const pauseIndicator = isPaused ? '⏸️ ' : '';
      document.title = `${pauseIndicator}${formattedTime} ${emoji} ${sessionName} - AI Pomo`;
    } else {
      // Restore original title if timer is not running
      if (window.originalDocumentTitle) {
        document.title = window.originalDocumentTitle;
      } else {
        document.title = 'AI Pomo';
      }
    }
  };

  // Update document title when timer state changes
  useEffect(() => {
    updateDocumentTitle();
  }, [isRunning, isPaused, timeRemaining, currentSession]);

  // Restore original title on unmount
  useEffect(() => {
    return () => {
      if (window.originalDocumentTitle) {
        document.title = window.originalDocumentTitle;
      }
    };
  }, []);

  // Provide the context value
  const contextValue = {
    isRunning,
    isPaused,
    timeRemaining,
    duration: Math.floor(duration / 1000), // Convert back to seconds for the API
    currentSession,
    pomodoroCount,
    projectId,
    taskId,
    sessionStartTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    switchActiveTask,
    handleActiveTaskChange, // Expose the new function
    getSessionDuration,
    setTimeRemaining,
    updateGlobalTimerState, // Expose the new function
    updateDocumentTitle, // Expose the title update function
  };

  return (
    <GlobalTimerContext.Provider value={contextValue}>
      {children}
    </GlobalTimerContext.Provider>
  );
};

export default GlobalTimerContext;
