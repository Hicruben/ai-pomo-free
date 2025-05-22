import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import { isAuthenticated } from './services/authService';
import { GlobalTimerProvider } from './contexts/GlobalTimerContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import AchievementNotification, { LevelUpNotification } from './components/AchievementNotification';
import SimpleLogin from './components/SimpleLogin';
import SimpleRegister from './components/SimpleRegister';
import ProjectList from './components/ProjectList';
import DirectProjectCreator from './components/DirectProjectCreator';
import ProjectManager from './components/ProjectManager';
import UserDataTest from './components/UserDataTest';
import PomodoroCountDebug from './components/PomodoroCountDebug';
import DisabledFeatureModal from './components/DisabledFeatureModal';
import TestDisabledFeature from './components/TestDisabledFeature';
import PomodoroInsertionTest from './components/PomodoroInsertionTest';
import DirectPomodoroTest from './components/DirectPomodoroTest';

// Import utilities
import { checkNewAchievements, calculateLevel } from './utils/statsUtils';

// Theme definitions
const lightTheme = {
  '--bg-color': '#f5f5f5',
  '--text-color': '#333',
  '--card-bg': '#ffffff',
  '--header-bg': '#ffffff',
  '--header-text': '#333',
  '--nav-bg': '#ffffff',
  '--nav-text': '#555',
  '--nav-hover-bg': '#f0f0f0',
  '--nav-active-bg': '#d95550',
  '--nav-active-text': '#ffffff',
};

const darkTheme = {
  '--bg-color': '#121212',
  '--text-color': '#e0e0e0',
  '--card-bg': '#1e1e1e',
  '--header-bg': '#1e1e1e',
  '--header-text': '#e0e0e0',
  '--nav-bg': '#1e1e1e',
  '--nav-text': '#b0b0b0',
  '--nav-hover-bg': '#2c2c2c',
  '--nav-active-bg': '#d95550',
  '--nav-active-text': '#ffffff',
};

// Global styles component
const GlobalStyles = styled.div`
  :root {
    --bg-color: ${props => props.theme['--bg-color']};
    --text-color: ${props => props.theme['--text-color']};
    --card-bg: ${props => props.theme['--card-bg']};
    --header-bg: ${props => props.theme['--header-bg']};
    --header-text: ${props => props.theme['--header-text']};
    --nav-bg: ${props => props.theme['--nav-bg']};
    --nav-text: ${props => props.theme['--nav-text']};
    --nav-hover-bg: ${props => props.theme['--nav-hover-bg']};
    --nav-active-bg: ${props => props.theme['--nav-active-bg']};
    --nav-active-text: ${props => props.theme['--nav-active-text']};
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 0.3s, color 0.3s;
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
  }

  html {
    overflow-x: hidden;
    max-width: 100vw;
  }
`;

function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('test');

  // State for dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('pomodoroDarkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // State for settings
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      workTime: 25,
      shortBreakTime: 5,
      longBreakTime: 15,
      longBreakInterval: 4,
      autoStartNextSession: false,
      tickingSound: false,
      volume: 50,
      selectedSound: 'bell',
    };
  });

  // State for settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // State for disabled feature modal
  const [isDisabledFeatureModalOpen, setIsDisabledFeatureModalOpen] = useState(false);

  // State for timer
  const [timerState, setTimerState] = useState(() => {
    const savedTimerState = localStorage.getItem('pomodoroTimerState');

    // Default state for new users or when forcing a work session
    const defaultWorkState = {
      isRunning: false,
      isPaused: false,
      currentSession: 'work',
      timeRemaining: settings.workTime * 60, // in seconds
      pomodoroCount: 0,
      projectId: null, // Track which project the timer belongs to
      lastUpdatedTime: Date.now(),
    };

    if (savedTimerState) {
      try {
        const parsedState = JSON.parse(savedTimerState);

        // Always ensure we start with a work session, never a break
        // This ensures break timer never appears on first login
        if (parsedState.currentSession === 'shortBreak' || parsedState.currentSession === 'longBreak') {
          return {
            ...parsedState,
            isRunning: false, // Don't auto-start
            isPaused: false,
            currentSession: 'work', // Force work session
            timeRemaining: settings.workTime * 60, // Reset timer to work time
            projectId: null, // Break sessions should not be associated with projects
            taskId: null, // Break sessions should not be associated with tasks
            lastUpdatedTime: Date.now(),
          };
        }

        // Even for work sessions, ensure we're not auto-starting on login
        return {
          ...parsedState,
          isRunning: false, // Ensure timer doesn't auto-start on login
          isPaused: false,
          lastUpdatedTime: Date.now(),
        };
      } catch (error) {
        return defaultWorkState;
      }
    } else {
      // No saved state, use default work state
      return defaultWorkState;
    }
  });

  // Timer interval reference
  const timerIntervalRef = React.useRef(null);

  // State for stats
  const [stats, setStats] = useState(() => {
    const savedStats = localStorage.getItem('pomodoroStats');
    return savedStats ? JSON.parse(savedStats) : {
      totalPomodoros: 0,
      pomodorosByDate: {},
      completedTasks: 0,
      experiencePoints: 0,
      unlockedAchievements: [],
      currentStreak: 0,
      longestStreak: 0,
      maxPomodorosInDay: 0
    };
  });

  // State for active task
  const [activeTaskId, setActiveTaskId] = useState(null);

  // State for active task
  const [activeTask, setActiveTask] = useState(null);

  // State for notifications
  const [notifications, setNotifications] = useState([]);

  // State for active project
  const [activeProject, setActiveProject] = useState(null);

  // State for projects
  const [projects, setProjects] = useState([]);

  // Load projects when component mounts
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Check if we're using the API
        if (isAuthenticated && typeof isAuthenticated === 'function' && isAuthenticated()) {
          // Import directly to avoid require issues
          const { projectApi } = await import('./services/apiService');

          if (projectApi && projectApi.getProjects) {
            console.log('[App] Loading projects from API');
            const loadedProjects = await projectApi.getProjects();
            console.log('[App] Loaded projects:', loadedProjects);
            setProjects(loadedProjects);
          }
        } else {
          // Load from localStorage as fallback
          const projectsJson = localStorage.getItem('pomodoroProjects');
          if (projectsJson) {
            try {
              const parsedProjects = JSON.parse(projectsJson);
              console.log('[App] Loaded projects from localStorage:', parsedProjects);
              setProjects(parsedProjects);
            } catch (error) {
              console.error('[App] Error parsing projects from localStorage:', error);
            }
          }
        }
      } catch (error) {
        console.error('[App] Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // State for user
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('[App] Error parsing user from localStorage:', error);
      }
    }
  }, []);

  // Add a global function to update the active task
  useEffect(() => {
    // Create a global function to update the active task
    window.updateGlobalActiveTask = (updatedTask) => {
      console.log(`[App] Global function updateGlobalActiveTask called with:`, updatedTask);
      if (updatedTask) {
        setActiveTask(updatedTask);

        // Update localStorage to ensure other components can access the latest task
        localStorage.setItem('activeTaskCache', JSON.stringify(updatedTask));
        localStorage.setItem('pomodoroActiveTaskId', updatedTask._id || updatedTask.id);

        // Force a re-render with a unique timestamp
        const timestamp = Date.now();
        console.log(`[App] Forcing re-render with timestamp: ${timestamp}`);
        setTimerState(prev => ({
          ...prev,
          lastUpdatedTime: timestamp
        }));
      } else {
        // If updatedTask is null, clear the active task
        console.log(`[App] Clearing active task`);
        setActiveTask(null);
        setActiveTaskId(null);

        // Clear localStorage
        localStorage.removeItem('activeTaskCache');
        localStorage.removeItem('pomodoroActiveTaskId');

        // Force a re-render
        const timestamp = Date.now();
        console.log(`[App] Forcing re-render with timestamp: ${timestamp}`);
        setTimerState(prev => ({
          ...prev,
          lastUpdatedTime: timestamp
        }));
      }
    };

    // Clean up the global function on unmount
    return () => {
      delete window.updateGlobalActiveTask;
    };
  }, []);

  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroTimerState', JSON.stringify(timerState));
  }, [timerState]);

  // Global timer management with precise timing
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    let startTime;
    let expectedTime;

    // If timer is running, start the interval with precise timing
    if (timerState.isRunning) {
      // Store the start time and expected next tick time
      startTime = Date.now();
      expectedTime = startTime + 1000; // 1 second in the future

      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const drift = now - expectedTime;

        // Update timer state
        setTimerState(prevState => {
          // Only decrement if still running
          if (!prevState.isRunning) return prevState;

          const newTimeRemaining = Math.max(0, prevState.timeRemaining - 1);

          // Check if timer completed
          if (newTimeRemaining <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;

            // Handle session completion
            const nextSession = getNextSession(prevState);

            // Track pomodoro completion if work session
            if (prevState.currentSession === 'work') {
              console.log(`[App] Work session completed for task ID: ${activeTaskId}`);
              console.log(`[App] Active task ID type: ${typeof activeTaskId}, value: ${activeTaskId}`);

              // Get the active task to ensure we have the correct ID
              console.log(`[App] Active task:`, activeTask);

              // Use the _id property if available, otherwise use the id property
              const taskIdToUse = activeTask ? (activeTask._id || activeTask.id) : activeTaskId;
              console.log(`[App] Using task ID for pomodoro completion: ${taskIdToUse}`);

              // This is a successfully completed pomodoro
              handlePomodoroCompleted({
                taskId: taskIdToUse,
                projectId: prevState.projectId,
                wasInterrupted: false,
                completed: true
              });
            }

            // For the next session, determine if we should associate with a project/task
            // Work sessions are associated with projects/tasks, breaks are NEVER associated with any task or project
            const isWorkSession = nextSession.session === 'work';
            const nextProjectId = isWorkSession ? prevState.projectId : null;
            const nextTaskId = isWorkSession ? activeTaskId : null;

            return {
              ...prevState,
              isRunning: settings.autoStartNextSession,
              currentSession: nextSession.session,
              pomodoroCount: nextSession.count,
              timeRemaining: getSessionTime(nextSession.session),
              projectId: nextProjectId, // Only associate work sessions with projects
              taskId: nextTaskId, // Only associate work sessions with tasks
              lastUpdatedTime: Date.now()
            };
          }

          return {
            ...prevState,
            timeRemaining: newTimeRemaining,
            lastUpdatedTime: Date.now()
          };
        });

        // Calculate the next expected tick time, accounting for drift
        expectedTime += 1000;

        // If we've drifted too much, reset the expected time
        if (drift > 1000) {
          expectedTime = now + 1000;
        }
      }, 1000);
    }

    // Clean up on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  // Get session time in seconds
  const getSessionTime = (session) => {
    switch (session) {
      case 'work':
        return settings.workTime * 60;
      case 'shortBreak':
        return settings.shortBreakTime * 60;
      case 'longBreak':
        return settings.longBreakTime * 60;
      default:
        return settings.workTime * 60;
    }
  };

  // Get next session and pomodoro count
  const getNextSession = (currentState) => {
    const { currentSession, pomodoroCount } = currentState;

    if (currentSession === 'work') {
      // After work session
      const newCount = (pomodoroCount + 1) % (settings.longBreakInterval || 4);
      const nextSession = newCount === 0 ? 'longBreak' : 'shortBreak';

      return {
        session: nextSession,
        count: newCount
      };
    } else {
      // After any break
      return {
        session: 'work',
        count: pomodoroCount
      };
    }
  };

  // Handle timer state change
  const handleTimerStateChange = (newTimerState) => {
    setTimerState(newTimerState);
  };

  // Handle timer tick
  const handleTimerTick = () => {
    // This function is called every second when the timer is running
    // We can use it to update any UI elements that need to be updated in real-time
  };

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // Load active task and ensure proper timer state when component mounts
  useEffect(() => {
    // Load active task directly without triggering handleSetActiveTask
    const savedActiveTaskId = localStorage.getItem('activeTaskId');
    if (savedActiveTaskId) {
      console.log('[App] Loading active task from localStorage:', savedActiveTaskId);

      // Find the project containing this task
      const project = projects.find(p =>
        p.tasks && p.tasks.some(t => t.id === savedActiveTaskId)
      );

      // Get task details directly from localStorage
      const tasksJson = localStorage.getItem('pomodoroTasks');
      if (tasksJson) {
        try {
          const tasks = JSON.parse(tasksJson);
          const task = tasks.find(t => t.id === savedActiveTaskId);

          if (task) {
            console.log('[App] Found task in localStorage:', task);
            // Update state directly without triggering events
            setActiveTaskId(savedActiveTaskId);
            setActiveProject(project);
            setActiveTask(task);
          }
        } catch (error) {
          console.error('[App] Error parsing tasks from localStorage:', error);
        }
      }
    }

    // Check for abandoned timers
    const abandonedTimer = localStorage.getItem('abandonedTimer');
    if (abandonedTimer) {
      try {
        const timerData = JSON.parse(abandonedTimer);
        // Clear the abandoned timer data
        localStorage.removeItem('abandonedTimer');

        // We don't count abandoned timers, so we don't call handlePomodoroCompleted
        // Instead, we could show a notification or log it for analytics
        // Don't count abandoned work sessions as completed pomodoros
        if (timerData.session === 'work') {
          // Abandoned work session
        }
      } catch (error) {
        localStorage.removeItem('abandonedTimer');
      }
    }

    // Check if the timer was running before page refresh
    const wasTimerRunning = sessionStorage.getItem('pomodoroTimerWasRunning') === 'true';
    console.log('[App] Was timer running before refresh?', wasTimerRunning);

    // Clear the flag
    sessionStorage.removeItem('pomodoroTimerWasRunning');

    // Always ensure we're showing a work timer on app load, never a break timer
    // This is a double-check in case the useState initialization didn't catch it
    setTimerState(prevState => {
      // Always force a work session on app load, regardless of previous state
      if (prevState.currentSession !== 'work') {
        return {
          ...prevState,
          isRunning: wasTimerRunning, // Restore running state if it was running before refresh
          isPaused: false,
          currentSession: 'work',
          timeRemaining: settings.workTime * 60,
          projectId: prevState.projectId, // Maintain project association for work sessions
          taskId: prevState.taskId, // Maintain task association for work sessions
          lastUpdatedTime: Date.now()
        };
      }

      // Ensure break sessions are never associated with tasks or projects
      if (prevState.currentSession === 'shortBreak' || prevState.currentSession === 'longBreak') {
        return {
          ...prevState,
          projectId: null, // Break sessions should not be associated with projects
          taskId: null, // Break sessions should not be associated with tasks
        };
      }

      // If the timer was running before refresh, restore its running state
      if (wasTimerRunning) {
        console.log('[App] Restoring timer running state after page refresh');

        // Calculate elapsed time since the timer was saved
        const savedTimerState = localStorage.getItem('pomodoroTimerState');
        if (savedTimerState) {
          try {
            const parsedState = JSON.parse(savedTimerState);
            const now = Date.now();
            const lastSavedTime = parsedState.lastSavedTime || 0;
            const elapsedSeconds = Math.floor((now - lastSavedTime) / 1000);

            // Adjust time remaining based on elapsed time
            const adjustedTimeRemaining = Math.max(1, prevState.timeRemaining - elapsedSeconds);

            console.log('[App] Adjusted time remaining after refresh:', adjustedTimeRemaining);

            return {
              ...prevState,
              isRunning: true, // Restore running state
              isPaused: false,
              timeRemaining: adjustedTimeRemaining,
              lastUpdatedTime: Date.now()
            };
          } catch (error) {
            console.error('[App] Error parsing saved timer state:', error);
          }
        }

        // If we couldn't parse the saved state, just restore the running state
        return {
          ...prevState,
          isRunning: true, // Restore running state
          isPaused: false,
          lastUpdatedTime: Date.now()
        };
      }

      return prevState;
    });
  }, [settings.workTime]);

  // Function to refresh the active task data
  const refreshActiveTask = async (taskId) => {
    if (!taskId) {
      console.log(`[App] Cannot refresh active task: taskId is null or undefined`);
      return;
    }

    try {
      console.log(`[App] Refreshing active task with ID: ${taskId}, type: ${typeof taskId}`);
      console.log(`[App] Current active task:`, activeTask);

      // For localStorage mode, get the updated task from localStorage
      const tasksJson = localStorage.getItem('pomodoroTasks');
      if (tasksJson) {
        try {
          const tasks = JSON.parse(tasksJson);
          console.log(`[App] Found ${tasks.length} tasks in localStorage`);

          const updatedTask = tasks.find(t =>
            (t.id === taskId) || (t._id === taskId)
          );

          if (updatedTask) {
            console.log(`[App] Found updated task in localStorage:`, updatedTask);
            setActiveTask(updatedTask);

            // Force a re-render by updating a timestamp
            setTimerState(prev => ({
              ...prev,
              lastUpdatedTime: Date.now()
            }));

            console.log(`[App] Active task state updated from localStorage`);
          } else {
            console.log(`[App] Task not found in localStorage tasks`);
          }
        } catch (parseError) {
          console.error(`[App] Error parsing tasks from localStorage:`, parseError);
        }
      } else {
        console.log(`[App] No tasks found in localStorage`);
      }
    } catch (error) {
      console.error(`[App] Error refreshing active task:`, error);
    }
  };

  // Handle pomodoro completion
  const handlePomodoroCompleted = async (data = {}) => {
    // Extract data from the parameter
    const {
      taskId,
      projectId,
      wasInterrupted = false,
      completed = true,
      isSkip = false,
      isNormalCompletion = false,
      currentSession = 'work' // Default to work session if not specified
    } = data;

    // If the pomodoro was interrupted by switching tasks or closing the browser,
    // we don't count it as completed
    if (!completed) {
      return;
    }

    console.log(`[App] Handling pomodoro completion with data:`, data);
    console.log(`[App] isSkip: ${isSkip}, isNormalCompletion: ${isNormalCompletion}`);
    console.log(`[App] currentSession: ${currentSession}`);

    // Skip button was clicked - don't create a pomodoro record or increment completedPomodoros
    if (isSkip) {
      console.log(`[App] Skip button was clicked - not creating pomodoro record or incrementing completedPomodoros`);
      return;
    }

    // Only create pomodoro records for work sessions, not for break sessions
    if (currentSession !== 'work') {
      console.log(`[App] Not a work session - not creating pomodoro record`);
      return;
    }

    // Check if we've already processed a pomodoro in the last 5 seconds
    // This prevents duplicate pomodoro creation when multiple components call this function
    if (window.lastPomodoroCreatedTime && (Date.now() - window.lastPomodoroCreatedTime < 5000)) {
      console.log(`[App] Preventing duplicate pomodoro creation - last one created ${Date.now() - window.lastPomodoroCreatedTime}ms ago`);
      return;
    }

    // Set the flag to prevent duplicate creation
    window.lastPomodoroCreatedTime = Date.now();

    // Create a unique ID for this pomodoro completion to prevent double counting
    const completionId = `pomodoro_${taskId}_${Date.now()}`;

    // Check if we've already processed this completion
    if (window.recentCompletions && window.recentCompletions.includes(completionId)) {
      console.log(`[App] Skipping duplicate pomodoro completion: ${completionId}`);
      return;
    }

    // Add to recent completions
    if (!window.recentCompletions) {
      window.recentCompletions = [];
    }
    window.recentCompletions.push(completionId);

    // Clean up old completions (keep only last 10)
    if (window.recentCompletions.length > 10) {
      window.recentCompletions = window.recentCompletions.slice(-10);
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Create pomodoro record in database if logged in
    if (user) {
      try {
        console.log(`[App] Creating pomodoro record in database`);

        // Import pomodoroApi dynamically
        const { pomodoroApi } = await import('./services/apiService');

        if (pomodoroApi && pomodoroApi.createPomodoro) {
          console.log(`[App] Calling pomodoroApi.createPomodoro with taskId: ${taskId}`);

          const result = await pomodoroApi.createPomodoro({
            taskId: taskId,
            projectId: projectId,
            startTime: new Date(Date.now() - settings.workTime * 60 * 1000),
            endTime: new Date(),
            duration: settings.workTime,
            completed: true,
            interrupted: wasInterrupted
          });

          console.log(`[App] Pomodoro record created successfully:`, result);

          // We don't need to make multiple API calls to update the task
          // The server will handle updating the completedPomodoros count
          console.log(`[App] Pomodoro record created successfully, no need for additional API calls`);

          // Set a flag to prevent multiple updates in a short time
          window.lastTaskUpdateTime = Date.now();
        } else {
          console.error('[App] pomodoroApi.createPomodoro is not available');
        }
      } catch (error) {
        console.error('[App] Error saving pomodoro:', error);
      }
    } else {
      console.log(`[App] User not logged in, skipping pomodoro creation`);
    }

    // Update local stats
    // Update pomodoro count
    const todayCount = (stats.pomodorosByDate[today] || 0) + 1;

    // Calculate experience points
    const basePoints = wasInterrupted ? 10 : 15; // More points for uninterrupted sessions

    // Update stats
    const newStats = {
      ...stats,
      totalPomodoros: stats.totalPomodoros + 1,
      pomodorosByDate: {
        ...stats.pomodorosByDate,
        [today]: todayCount
      },
      experiencePoints: stats.experiencePoints + basePoints,
      maxPomodorosInDay: Math.max(stats.maxPomodorosInDay, todayCount)
    };

    // Check for level up
    const oldLevel = calculateLevel(stats.experiencePoints);
    const newLevel = calculateLevel(newStats.experiencePoints);

    if (newLevel > oldLevel) {
      // Show level up notification
      setNotifications(prev => [
        ...prev,
        { type: 'levelUp', level: newLevel, id: Date.now() }
      ]);
    }

    // Check for new achievements
    const newAchievements = checkNewAchievements(newStats, stats.unlockedAchievements);

    if (newAchievements.length > 0) {
      // Add new achievements to stats
      newStats.unlockedAchievements = [
        ...stats.unlockedAchievements,
        ...newAchievements
      ];

      // Show achievement notifications
      newAchievements.forEach(achievementId => {
        setNotifications(prev => [
          ...prev,
          { type: 'achievement', achievementId, id: Date.now() + Math.random() }
        ]);
      });
    }

    // Update stats
    setStats(newStats);

    // Ensure stats are saved to localStorage immediately
    localStorage.setItem('pomodoroStats', JSON.stringify(newStats));

    // Update the timer state immediately instead of using setTimeout
    // This prevents the delayed second refresh
    console.log(`[App] Updating timer state immediately to refresh ActiveTimerDisplay`);
    setTimerState(prev => ({
      ...prev,
      lastUpdatedTime: Date.now()
    }));

    // We don't need to show a notification here as it's already shown in GlobalTimerContext.js
    // This prevents duplicate notifications
  };

  // Handle active task change
  const handleSetActiveTask = (taskId) => {
    console.log('[App] handleSetActiveTask called with taskId:', taskId);

    // Find the project containing this task
    if (taskId) {
      const project = projects.find(p =>
        p.tasks && p.tasks.some(t => t.id === taskId)
      );

      // Get task details
      const tasksJson = localStorage.getItem('pomodoroTasks');
      if (tasksJson) {
        const tasks = JSON.parse(tasksJson);
        const task = tasks.find(t => t.id === taskId);

        // Extract project ID from task data if available
        let projectId = task ? (task.projectId ||
          (task.project ?
            (typeof task.project === 'object' ?
              (task.project._id || task.project.id) :
              task.project) :
            null)) : null;

        // Extract task and project names for the warning message
        const taskName = task ? (task.title || task.name || 'this task') : 'this task';
        const projectName = project ? (project.title || project.name || 'this project') : 'this project';

        // Check if timer is running or paused
        const timerRunning = timerState.isRunning || timerState.isPaused;

        // If timer is running, show warning dialog
        if (timerRunning) {
          const warningMessage = `Switching to ${taskName} will reset your current timer. Are you sure?`;
          const confirmed = window.confirm(warningMessage);

          if (!confirmed) {
            console.log('[App] User cancelled task change');
            return; // Do nothing if user cancels
          }

          // User confirmed, proceed with task change
          console.log('[App] User confirmed task change, proceeding');
        }

        // Dispatch event to notify the timer context about the task change
        console.log('[App] Dispatching activeTaskChanged event with taskId:', taskId, 'projectId:', projectId);
        window.dispatchEvent(new CustomEvent('activeTaskChanged', {
          detail: {
            taskId: taskId,
            projectId: projectId,
            taskName: taskName,
            projectName: projectName
          }
        }));

        // Update state
        setActiveTaskId(taskId);
        localStorage.setItem('activeTaskId', taskId);
        localStorage.setItem('pomodoroActiveTaskId', taskId);
        localStorage.setItem('activeTaskCache', JSON.stringify(task));
        setActiveProject(project);
        setActiveTask(task);

        // Notify other components that the active task has been updated
        if (window.updateGlobalActiveTask) {
          window.updateGlobalActiveTask(task);
        }
      } else {
        // No task details available

        // Check if timer is running or paused
        const timerRunning = timerState.isRunning || timerState.isPaused;

        // If timer is running, show warning dialog
        if (timerRunning) {
          const warningMessage = `Switching to this task will reset your current timer. Are you sure?`;
          const confirmed = window.confirm(warningMessage);

          if (!confirmed) {
            console.log('[App] User cancelled task change');
            return; // Do nothing if user cancels
          }

          // User confirmed, proceed with task change
          console.log('[App] User confirmed task change, proceeding');
        }

        // Dispatch event to notify the timer context about the task change
        console.log('[App] Dispatching activeTaskChanged event with basic info');
        window.dispatchEvent(new CustomEvent('activeTaskChanged', {
          detail: {
            taskId: taskId,
            projectId: null,
            taskName: 'this task',
            projectName: 'this project'
          }
        }));

        // Update state
        setActiveTaskId(taskId);
        localStorage.setItem('activeTaskId', taskId);
        localStorage.setItem('pomodoroActiveTaskId', taskId);
        setActiveProject(project);
        setActiveTask(null);

        // Since we don't have task details, we can't update the activeTaskCache
        // But we should still notify other components that the active task has changed
        if (window.updateGlobalActiveTask) {
          // Create a minimal task object with just the ID
          const minimalTask = { id: taskId, _id: taskId };
          window.updateGlobalActiveTask(minimalTask);
        }
      }
    } else {
      // Clearing the active task

      // Check if timer is running or paused
      const timerRunning = timerState.isRunning || timerState.isPaused;

      // If timer is running, show warning dialog
      if (timerRunning) {
        const warningMessage = `Clearing the active task will reset your current timer. Are you sure?`;
        const confirmed = window.confirm(warningMessage);

        if (!confirmed) {
          console.log('[App] User cancelled clearing active task');
          return; // Do nothing if user cancels
        }

        // User confirmed, proceed with clearing
        console.log('[App] User confirmed clearing active task, proceeding');
      }

      // Dispatch event to notify the timer context about the task change
      console.log('[App] Dispatching activeTaskChanged event to clear active task');
      window.dispatchEvent(new CustomEvent('activeTaskChanged', {
        detail: {
          taskId: null,
          projectId: null,
          taskName: 'the active task',
          projectName: 'the active project'
        }
      }));

      // Update state
      setActiveTaskId(null);
      localStorage.removeItem('activeTaskId');
      localStorage.removeItem('pomodoroActiveTaskId');
      localStorage.removeItem('activeTaskCache');
      setActiveProject(null);
      setActiveTask(null);

      // Notify other components that the active task has been cleared
      if (window.updateGlobalActiveTask) {
        window.updateGlobalActiveTask(null);
      }
    }
  };

  // Handle task completion
  const handleTaskCompleted = () => {
    setStats(prev => ({
      ...prev,
      completedTasks: prev.completedTasks + 1
    }));
  };

  // Handle Todoist task import
  const handleImportTasks = (tasks) => {
    // Implementation will be added later
  };

  // Remove a notification
  const removeNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // State for theme toggle disabled feature modal
  const [isThemeToggleModalOpen, setIsThemeToggleModalOpen] = useState(false);

  // Toggle dark mode - now shows the disabled feature message
  const toggleDarkMode = () => {
    // Instead of toggling dark mode, show the disabled feature modal
    setIsThemeToggleModalOpen(true);
  };

  // Close theme toggle disabled feature modal
  const closeThemeToggleModal = () => {
    setIsThemeToggleModalOpen(false);
  };

  // Open settings modal - now shows the disabled feature message instead
  const openSettings = () => {
    // Instead of opening the actual settings, show the disabled feature modal
    setIsDisabledFeatureModalOpen(true);
  };

  // Close settings modal
  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  // Close disabled feature modal
  const closeDisabledFeatureModal = () => {
    setIsDisabledFeatureModalOpen(false);
  };

  // Save settings
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  // Get current theme
  const theme = darkMode ? darkTheme : lightTheme;

  // Apply theme to body
  useEffect(() => {
    document.body.style.backgroundColor = theme['--bg-color'];
    document.body.style.color = theme['--text-color'];
  }, [theme]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppContainer>
        <Header>
          <h1>🍅 AI Pomo</h1>
          <HeaderButtons>
            <SettingsButton onClick={openSettings}>
              Settings
            </SettingsButton>
            <ThemeToggle onClick={toggleDarkMode}>
              {darkMode ? 'Light' : 'Dark'} Mode
            </ThemeToggle>
          </HeaderButtons>
        </Header>

        <Navigation>
          <NavButton
            isActive={activeTab === 'test'}
            onClick={() => setActiveTab('test')}
          >
            Test
          </NavButton>


          <NavButton
            isActive={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </NavButton>
        </Navigation>

        <MainContent>
          {activeTab === 'test' && (
            <>
              <h2>Test Components</h2>
              <p>These components are for testing functionality.</p>

              <h3>Step 1: Authentication</h3>
              <p>You need to login or register first to create projects in MongoDB.</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h4>Login</h4>
                  <SimpleLogin />
                </div>
                <div style={{ flex: 1 }}>
                  <h4>Register</h4>
                  <SimpleRegister />
                </div>
              </div>

              <h3>Step 2: User Data Binding Test</h3>
              <p>This component tests the binding between users and their data.</p>
              <UserDataTest />

              <h3>Step 3: Manage Existing Projects</h3>
              <p>Use this tool to finish or delete existing projects.</p>
              <ProjectManager />

              <h3>Step 4: Create New Projects</h3>
              <p>After managing your existing projects, you can create new projects here.</p>
              <DirectProjectCreator />

              <h3>Step 5: Project List Component</h3>
              <p>This is the actual ProjectList component used in the app.</p>
              <ProjectList onSelectProject={() => {}} activeProjectId={null} />

              <h3>Step 6: Pomodoro Count Debug</h3>
              <p>Use this tool to debug pomodoro count issues.</p>
              <PomodoroCountDebug />

              <h3>Step 7: Pomodoro Insertion Test</h3>
              <p>Use this tool to test if pomodoro records are inserted into the database when a timer completes.</p>
              <PomodoroInsertionTest />

              <h3>Step 8: Direct Pomodoro API Test</h3>
              <p>This test directly calls the API endpoint to verify database insertion works correctly.</p>
              <DirectPomodoroTest />

              <h3>Step 9: Test Disabled Feature Modal</h3>
              <p>Use this tool to test the disabled feature modal.</p>
              <TestDisabledFeature />
            </>
          )}



          {activeTab === 'stats' && <Statistics />}
        </MainContent>

        {/* Settings component is still here but will never be shown */}
        <Settings
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          settings={settings}
          onSave={saveSettings}
        />

        {/* Disabled feature modal that will be shown instead of settings */}
        <DisabledFeatureModal
          isOpen={isDisabledFeatureModalOpen}
          onClose={closeDisabledFeatureModal}
          featureName="Settings"
          message="The Settings feature will be available in a future release. We're working on making your timer experience fully customizable!"
        />

        {/* Disabled feature modal for theme toggle */}
        <DisabledFeatureModal
          isOpen={isThemeToggleModalOpen}
          onClose={closeThemeToggleModal}
          featureName="Theme Toggle"
          message="The Dark/Light mode toggle will be available in the next release. We're working on making your experience visually comfortable!"
        />

        {/* Notifications */}
        {notifications.map(notification => (
          notification.type === 'achievement' ? (
            <AchievementNotification
              key={notification.id}
              achievementId={notification.achievementId}
              onClose={() => removeNotification(notification.id)}
            />
          ) : (
            <LevelUpNotification
              key={notification.id}
              level={notification.level}
              onClose={() => removeNotification(notification.id)}
            />
          )
        ))}
      </AppContainer>
    </ThemeProvider>
  );
}

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme['--bg-color']};
  color: ${props => props.theme['--text-color']};
  transition: background-color 0.3s, color 0.3s;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: ${props => props.theme['--header-bg']};
  color: ${props => props.theme['--header-text']};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ThemeToggle = styled.button`
  background: none;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: ${props => props.theme['--header-text']};
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SettingsButton = styled(ThemeToggle)`
  background-color: ${props => props.theme['--nav-active-bg']};
  color: white;

  &:hover {
    background-color: #c04540;
  }
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  background-color: ${props => props.theme['--nav-bg']};
  padding: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.2rem;
  background: ${props => props.isActive ? props.theme['--nav-active-bg'] : 'transparent'};
  color: ${props => props.isActive ? props.theme['--nav-active-text'] : props.theme['--nav-text']};
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  flex: 1;
  max-width: 120px;

  &:hover {
    background-color: ${props => props.isActive ? props.theme['--nav-active-bg'] : props.theme['--nav-hover-bg']};
  }

  & + & {
    margin-left: 0.5rem;
  }
`;

const MainContent = styled.main`
  padding: 1rem 0.5rem 2rem;
  width: 60%;
  max-width: 600px;
  margin: 0 auto;

  @media (max-width: 768px) {
    width: 85%;
  }

  @media (max-width: 480px) {
    width: 95%;
  }
`;

// Wrap App with GlobalTimerProvider
const AppWithGlobalTimer = () => {
  // Get the current theme preference from localStorage
  const isDarkMode = JSON.parse(localStorage.getItem('pomodoroDarkMode') || 'false');

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <GlobalTimerProvider>
        <App />
      </GlobalTimerProvider>
    </>
  );
};

export default AppWithGlobalTimer;
