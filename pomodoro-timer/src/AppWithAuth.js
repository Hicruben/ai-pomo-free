import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import { GlobalTimerProvider } from './contexts/GlobalTimerContext';
import { SettingsProvider } from './context/SettingsContext';

// Import components
import Settings from './components/Settings';
import DisabledFeatureModal from './components/DisabledFeatureModal';
import Statistics from './components/Statistics';
import AchievementNotification, { LevelUpNotification } from './components/AchievementNotification';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ChangePassword from './components/auth/ChangePassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/layout/Header';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';

import ProjectDescriptionCard from './components/ProjectDescriptionCard';
import Calendar from './components/Calendar';
import LandingPage from './components/LandingPage';
import GmailStyleLandingPage from './components/GmailStyleLandingPage';
import GmailStyleNewLandingPage from './components/GmailStyleNewLandingPage';
import AppFlowyStyleLandingPage from './components/AppFlowyStyleLandingPage';
import TestPomodoroPage from './pages/TestPomodoroPage';
import StandalonePomodoroPage from './pages/StandalonePomodoroPage';
import AIProjectGenerator from './components/AIProjectGenerator';

import AdminPage from './components/admin/AdminPage';


// Import utilities
import { checkNewAchievements, calculateLevel } from './utils/statsUtils';
import { getCurrentUser, isAuthenticated, logout } from './services/authService';
import { taskApi, pomodoroApi, statsApi, userApi, projectApi, milestoneApi } from './services/apiService';
import eventBus from './utils/eventBus';

// Theme definitions
const lightTheme = {
  '--bg-color': '#f5f5f5',
  '--text-color': '#333',
  '--text-secondary': '#666',
  '--card-bg': '#ffffff',
  '--header-bg': '#ffffff',
  '--header-bg-gradient': '#f8f8f8',
  '--header-text': '#333',
  '--nav-bg': '#ffffff',
  '--nav-text': '#555',
  '--nav-hover-bg': 'rgba(217, 85, 80, 0.05)',
  '--nav-active-bg': 'rgba(217, 85, 80, 0.08)',
  '--nav-active-text': '#d95550',
  '--primary-color': '#d95550',
  '--primary-gradient': '#eb6b56',
  '--primary-hover': '#c04540',
};

const darkTheme = {
  '--bg-color': '#121212',
  '--text-color': '#e0e0e0',
  '--text-secondary': '#a0a0a0',
  '--card-bg': '#1e1e1e',
  '--header-bg': '#1e1e1e',
  '--header-bg-gradient': '#252525',
  '--header-text': '#e0e0e0',
  '--nav-bg': '#1e1e1e',
  '--nav-text': '#b0b0b0',
  '--nav-hover-bg': 'rgba(217, 85, 80, 0.1)',
  '--nav-active-bg': 'rgba(217, 85, 80, 0.15)',
  '--nav-active-text': '#eb6b56',
  '--primary-color': '#d95550',
  '--primary-gradient': '#eb6b56',
  '--primary-hover': '#c04540',
};

function App() {
  // State for authentication
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for active tab
  const [activeTab, setActiveTabState] = useState(() => {
    // Check if we have an initial tab from a redirect
    if (window.initialActiveTab) {
      const tab = window.initialActiveTab;
      // Clear the initial tab so it's only used once
      window.initialActiveTab = null;
      return tab;
    }
    return 'pomodoro';
  });

  // Wrapper for setActiveTab to preserve active task when switching tabs
  const setActiveTab = (tab) => {
    // Before switching tabs, ensure the active task is cached
    if (globalActiveTask) {
      localStorage.setItem('activeTaskCache', JSON.stringify(globalActiveTask));
    }

    // Update the active tab
    setActiveTabState(tab);
  };

  // Make setActiveTab available globally for timer conflict resolution
  useEffect(() => {
    window.setActiveTab = setActiveTab;

    return () => {
      delete window.setActiveTab;
    };
  }, []);

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
      lastUpdatedTime: Date.now(),
    };

    if (savedTimerState) {
      try {
        const parsedState = JSON.parse(savedTimerState);

        // Always ensure we start with a work session, never a break
        // This ensures break timer never appears on first login or when creating a new project
        if (parsedState.currentSession === 'shortBreak' || parsedState.currentSession === 'longBreak') {
          console.log('Forcing work session on app load (was in break session)');
          return {
            ...parsedState,
            isRunning: false, // Don't auto-start
            isPaused: false,
            currentSession: 'work', // Force work session
            timeRemaining: settings.workTime * 60, // Reset timer to work time
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
        console.error('Error parsing saved timer state:', error);
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
  const [activeTaskId, setActiveTaskId] = useState(() => {
    // Load active task ID from localStorage (for non-authenticated users)
    const savedActiveTaskId = localStorage.getItem('pomodoroActiveTaskId');
    console.log('Initial activeTaskId from localStorage:', savedActiveTaskId);
    return savedActiveTaskId || null;
  });

  // State for global active task (from database or localStorage)
  const [globalActiveTask, setGlobalActiveTask] = useState(() => {
    // Try to load from cache on initial render
    const cachedTaskJson = localStorage.getItem('activeTaskCache');
    if (cachedTaskJson) {
      try {
        const cachedTask = JSON.parse(cachedTaskJson);
        console.log('Initial globalActiveTask from localStorage:', cachedTask);

        // Ensure the activeTaskId is also saved
        if (cachedTask && (cachedTask._id || cachedTask.id)) {
          localStorage.setItem('pomodoroActiveTaskId', cachedTask._id || cachedTask.id);
        }

        return cachedTask;
      } catch (e) {
        console.error('Error parsing cached task:', e);
      }
    }
    return null;
  });

  // State for projects
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // State for notifications
  const [notifications, setNotifications] = useState([]);

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

  // Handle pomodoro completion
  const handlePomodoroCompleted = async (data = {}) => {
    // Extract data from the parameter
    const {
      taskId,
      projectId,
      wasInterrupted = false,
      completed = true,
      isNormalCompletion = false,
      isSkip = false,
      currentSession = 'work' // Default to work session if not specified
    } = data;

    console.log('[AppWithAuth] handlePomodoroCompleted called with data:', data);
    console.log('[AppWithAuth] isNormalCompletion:', isNormalCompletion);
    console.log('[AppWithAuth] isSkip:', isSkip);
    console.log('[AppWithAuth] currentSession:', currentSession);

    // Skip button was clicked - don't create a pomodoro record
    if (isSkip) {
      console.log('[AppWithAuth] Skip button was clicked - not creating pomodoro record');
      return;
    }

    // If the pomodoro was not completed, don't count it
    if (!completed) {
      console.log('[AppWithAuth] Pomodoro was not completed - not creating record');
      return;
    }

    // Only create pomodoro records for work sessions, not for break sessions
    if (currentSession !== 'work') {
      console.log('[AppWithAuth] Not a work session - not creating pomodoro record');
      return;
    }

    // Check if we've already processed a pomodoro in the last 5 seconds
    // This prevents duplicate pomodoro creation when multiple components call this function
    if (window.lastPomodoroCreatedTime && (Date.now() - window.lastPomodoroCreatedTime < 5000)) {
      console.log(`[AppWithAuth] Preventing duplicate pomodoro creation - last one created ${Date.now() - window.lastPomodoroCreatedTime}ms ago`);
      return;
    }

    // Set the flag to prevent duplicate creation
    window.lastPomodoroCreatedTime = Date.now();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Create pomodoro record in database if logged in
    if (user) {
      try {
        console.log('[AppWithAuth] Creating pomodoro record with taskId:', taskId, 'projectId:', projectId);

        const pomodoroData = await pomodoroApi.createPomodoro({
          taskId: taskId,
          projectId: projectId,
          startTime: new Date(Date.now() - settings.workTime * 60 * 1000),
          endTime: new Date(),
          duration: settings.workTime,
          completed: true,
          interrupted: wasInterrupted === true // Ensure it's a boolean
        });

        console.log('[AppWithAuth] Pomodoro record created successfully:', pomodoroData);

        // Directly aggregate the pomodoro data after completion
        console.log('[AppWithAuth] Directly aggregating pomodoro data after completion');
        try {
          await statsApi.aggregatePomodoros();
          console.log('[AppWithAuth] Pomodoro data aggregated successfully');
        } catch (aggregateError) {
          console.error('[AppWithAuth] Error aggregating pomodoro data:', aggregateError);
        }

        // Don't emit another pomodoroCompleted event here
        // The event is already emitted by GlobalTimerContext.js
        console.log('[AppWithAuth] Not emitting pomodoroCompleted event to prevent double refresh');
      } catch (error) {
        console.error('[AppWithAuth] Error saving pomodoro:', error);
      }
    } else {
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

      // Update task progress if there's an active task
      if (taskId) {
        // Get all tasks from localStorage
        const tasksJson = localStorage.getItem('pomodoroTasks');
        if (tasksJson) {
          const tasks = JSON.parse(tasksJson);
          const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                completedPomodoros: (task.completedPomodoros || 0) + 1
              };
            }
            return task;
          });

          // Save updated tasks back to localStorage
          localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
        }
      }

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

      // Don't emit another pomodoroCompleted event here
      // The event is already emitted by GlobalTimerContext.js
      console.log('[AppWithAuth] Not emitting pomodoroCompleted event for non-authenticated user to prevent double refresh');
    }

    // We don't need to show a notification here as it's already shown in GlobalTimerContext.js
    // This prevents duplicate notifications
  };

  // Check for AI tab navigation flag
  useEffect(() => {
    // Check if we need to navigate to the AI tab
    const navigateToAITab = localStorage.getItem('navigateToAITab');
    if (navigateToAITab === 'true') {
      console.log('Navigating to AI tab based on localStorage flag');
      setActiveTab('ai');
      localStorage.removeItem('navigateToAITab');
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);

          // Load user settings if available
          if (userData.settings) {
            setSettings(userData.settings);
          }

          // Load user stats
          try {
            const userStats = await statsApi.getStats();
            if (userStats) {
              setStats(userStats);
            }
          } catch (error) {
            console.error('Error loading stats:', error);
          }

          // Load global active task
          try {
            const { activeTask } = await userApi.getActiveTask();
            console.log('Active task from server:', activeTask);

            if (activeTask) {
              console.log('Setting active task from server:', activeTask);
              setGlobalActiveTask(activeTask);
              setActiveTaskId(activeTask._id);

              // Cache the active task
              localStorage.setItem('activeTaskCache', JSON.stringify(activeTask));
            } else {
              console.log('No active task found on server, clearing local state');
              setGlobalActiveTask(null);
              setActiveTaskId(null);

              // Clear any cached task
              localStorage.removeItem('activeTaskCache');
              localStorage.removeItem('pomodoroActiveTaskId');
            }
          } catch (error) {
            console.error('Error loading active task:', error);

            // Clear active task on error to be safe
            setGlobalActiveTask(null);
            setActiveTaskId(null);
            localStorage.removeItem('activeTaskCache');
            localStorage.removeItem('pomodoroActiveTaskId');
          }
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Listen for tab change events
  useEffect(() => {
    const handleTabChange = (event) => {
      console.log('AppWithAuth: Received changeTab event', event.detail);

      // Only proceed if the event wasn't prevented by another component
      if (!event.defaultPrevented && event.detail && event.detail.tab) {
        console.log('AppWithAuth: Changing tab to', event.detail.tab);
        setActiveTab(event.detail.tab);
      } else {
        console.log('AppWithAuth: Tab change was prevented or missing tab detail');
      }
    };

    // Add event listener
    window.addEventListener('changeTab', handleTabChange);

    // Clean up
    return () => {
      window.removeEventListener('changeTab', handleTabChange);
    };
  }, []);

  // Listen for project selection events
  useEffect(() => {
    const handleSelectProject = (project) => {
      if (project) {
        setActiveProject(project);
      }
    };

    // Add event listener
    eventBus.on('selectProject', handleSelectProject);

    // Clean up
    return () => {
      eventBus.off('selectProject', handleSelectProject);
    };
  }, []);

  // Load projects
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        if (isAuthenticated()) {
          // Fetch projects from API if authenticated
          const fetchedProjects = await projectApi.getProjects('open,working');
          setProjects(fetchedProjects);

          // Set active project if there's a working project
          const workingProject = fetchedProjects.find(p => p.status === 'working');
          if (workingProject) {
            setActiveProject(workingProject);
          }

          // Check if we need to navigate to a specific project (from View Timer button)
          const navigateToProjectId = localStorage.getItem('navigateToProjectId');
          if (navigateToProjectId) {
            console.log('[AppWithAuth] Found navigateToProjectId in localStorage:', navigateToProjectId);

            // Find the project to navigate to
            const projectToNavigate = fetchedProjects.find(p =>
              p._id === navigateToProjectId || p.id === navigateToProjectId
            );

            if (projectToNavigate) {
              console.log('[AppWithAuth] Found project to navigate to:', projectToNavigate);

              // Set the project as active
              setActiveProject(projectToNavigate);

              // Switch to the projects tab
              setActiveTab('projects');

              // Clear the navigation flag
              localStorage.removeItem('navigateToProjectId');
            } else {
              console.log('[AppWithAuth] Project to navigate to not found in fetched projects');
              localStorage.removeItem('navigateToProjectId');
            }
          }
        } else {
          // Load from localStorage if not authenticated
          const savedProjects = localStorage.getItem('pomodoroProjects');
          const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

          // Filter open and working projects
          const openProjects = parsedProjects.filter(project =>
            project.status === 'open' || project.status === 'working'
          );

          setProjects(openProjects);

          // Set active project if there's a working project
          const workingProject = openProjects.find(p => p.status === 'working');
          if (workingProject) {
            setActiveProject(workingProject);
          }

          // Check if we need to navigate to a specific project (from View Timer button)
          const navigateToProjectId = localStorage.getItem('navigateToProjectId');
          if (navigateToProjectId) {
            console.log('[AppWithAuth] Found navigateToProjectId in localStorage:', navigateToProjectId);

            // Find the project to navigate to
            const projectToNavigate = openProjects.find(p =>
              p.id === navigateToProjectId || p._id === navigateToProjectId
            );

            if (projectToNavigate) {
              console.log('[AppWithAuth] Found project to navigate to:', projectToNavigate);

              // Set the project as active
              setActiveProject(projectToNavigate);

              // Switch to the projects tab
              setActiveTab('projects');

              // Clear the navigation flag
              localStorage.removeItem('navigateToProjectId');
            } else {
              console.log('[AppWithAuth] Project to navigate to not found in open projects');
              localStorage.removeItem('navigateToProjectId');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);

        // Fallback to localStorage if API fails
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        // Filter open and working projects
        const openProjects = parsedProjects.filter(project =>
          project.status === 'open' || project.status === 'working'
        );

        setProjects(openProjects);

        // Set active project if there's a working project
        const workingProject = openProjects.find(p => p.status === 'working');
        if (workingProject) {
          setActiveProject(workingProject);
        }

        // Check if we need to navigate to a specific project (from View Timer button)
        const navigateToProjectId = localStorage.getItem('navigateToProjectId');
        if (navigateToProjectId) {
          console.log('[AppWithAuth] Found navigateToProjectId in localStorage:', navigateToProjectId);

          // Find the project to navigate to
          const projectToNavigate = openProjects.find(p =>
            p.id === navigateToProjectId || p._id === navigateToProjectId
          );

          if (projectToNavigate) {
            console.log('[AppWithAuth] Found project to navigate to:', projectToNavigate);

            // Set the project as active
            setActiveProject(projectToNavigate);

            // Switch to the projects tab
            setActiveTab('projects');

            // Clear the navigation flag
            localStorage.removeItem('navigateToProjectId');
          } else {
            console.log('[AppWithAuth] Project to navigate to not found in fallback projects');
            localStorage.removeItem('navigateToProjectId');
          }
        }
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // We no longer need to save settings to localStorage or database here
  // This is now handled directly in the TimerContext

  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroTimerState', JSON.stringify(timerState));
  }, [timerState]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // Listen for storage events to update globalActiveTask
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'activeTaskCache') {
        try {
          if (e.newValue) {
            const cachedTask = JSON.parse(e.newValue);
            console.log('Storage event: activeTaskCache updated:', cachedTask);
            setGlobalActiveTask(cachedTask);
          } else {
            console.log('Storage event: activeTaskCache cleared');
            setGlobalActiveTask(null);
          }
        } catch (err) {
          console.error('Error parsing activeTaskCache from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen for project navigation events from the timer conflict dialog
  useEffect(() => {
    const handleNavigateToProject = (event) => {
      console.log('[AppWithAuth] Received navigateToProject event:', event.detail);
      const { projectId } = event.detail;

      if (projectId) {
        // Find the project in the projects list
        const project = projects.find(p =>
          p.id === projectId || p._id === projectId
        );

        if (project) {
          console.log('[AppWithAuth] Found project to navigate to:', project);

          // Set the project as active
          handleSelectProject(project);

          // Switch to the projects tab
          setActiveTab('projects');

          // Mark the navigation as handled
          window.projectNavigationHandled = true;

          // Clear the flag after a short delay
          setTimeout(() => {
            window.projectNavigationHandled = false;
          }, 1000);
        } else {
          console.log('[AppWithAuth] Project not found in projects list');
        }
      }
    };

    window.addEventListener('navigateToProject', handleNavigateToProject);

    return () => {
      window.removeEventListener('navigateToProject', handleNavigateToProject);
    };
  }, [projects]);

  // Update globalActiveTask when activeTaskId changes
  useEffect(() => {
    if (!activeTaskId) {
      return;
    }

    // If we already have a globalActiveTask that matches the activeTaskId, no need to update
    if (globalActiveTask &&
        (globalActiveTask.id === activeTaskId || globalActiveTask._id === activeTaskId)) {
      return;
    }

    console.log('Updating globalActiveTask from activeTaskId:', activeTaskId);

    // Try to find the task in localStorage
    const cachedTaskJson = localStorage.getItem('activeTaskCache');
    if (cachedTaskJson) {
      try {
        const cachedTask = JSON.parse(cachedTaskJson);
        if (cachedTask && (cachedTask.id === activeTaskId || cachedTask._id === activeTaskId)) {
          console.log('Found matching task in cache:', cachedTask);
          setGlobalActiveTask(cachedTask);
          return;
        }
      } catch (e) {
        console.error('Error parsing cached task:', e);
      }
    }

    // If not found in cache, look in all tasks
    const tasksJson = localStorage.getItem('pomodoroTasks');
    if (tasksJson) {
      try {
        const allTasks = JSON.parse(tasksJson);
        const task = allTasks.find(t => t.id === activeTaskId || t._id === activeTaskId);
        if (task) {
          console.log('Found matching task in all tasks:', task);
          setGlobalActiveTask(task);
          localStorage.setItem('activeTaskCache', JSON.stringify(task));
          return;
        }
      } catch (e) {
        console.error('Error parsing tasks:', e);
      }
    }

    // If authenticated, try to fetch from API
    if (isAuthenticated()) {
      taskApi.getTasks(activeTaskId)
        .then(task => {
          if (task) {
            console.log('Found matching task in API:', task);
            setGlobalActiveTask(task);
            localStorage.setItem('activeTaskCache', JSON.stringify(task));
          }
        })
        .catch(error => {
          console.error('Error fetching task from API:', error);
        });
    }
  }, [activeTaskId, globalActiveTask]);

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
              handlePomodoroCompleted(prevState.isPaused);
            }

            return {
              ...prevState,
              isRunning: settings.autoStartNextSession,
              currentSession: nextSession.session,
              pomodoroCount: nextSession.count,
              timeRemaining: getSessionTime(nextSession.session),
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
  }, [timerState.isRunning, getNextSession, getSessionTime, handlePomodoroCompleted, settings.autoStartNextSession]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Get current theme
  const theme = darkMode ? darkTheme : lightTheme;

  // Apply theme to body
  useEffect(() => {
    document.body.style.backgroundColor = theme['--bg-color'];
    document.body.style.color = theme['--text-color'];
  }, [theme]);

  // Double-check to ensure we're always in a work session when the app loads
  useEffect(() => {
    // If the timer is in a break session, force it to a work session
    if (timerState.currentSession === 'shortBreak' || timerState.currentSession === 'longBreak') {
      console.log('Forcing work session on app load (useEffect check)');
      setTimerState(prevState => ({
        ...prevState,
        isRunning: false,
        isPaused: false,
        currentSession: 'work',
        timeRemaining: settings.workTime * 60,
        lastUpdatedTime: Date.now()
      }));
    }
  }, []);

  // Handle timer state change
  const handleTimerStateChange = (newTimerState) => {
    setTimerState(newTimerState);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Open settings modal
  const openSettings = () => {
    // Open the actual settings dialog
    setIsSettingsOpen(true);
  };

  // Close settings modal
  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  // Close disabled feature modal
  const closeDisabledFeatureModal = () => {
    setIsDisabledFeatureModalOpen(false);
  };

  // Handle project selection
  const handleSelectProject = (project) => {
    setActiveProject(project);

    // Always ensure the timer is in a work session when selecting a project
    // This fixes the issue where a new project might start with a break session
    const workSessionTimerState = {
      ...timerState,
      isRunning: false,
      isPaused: false,
      currentSession: 'work',
      timeRemaining: settings.workTime * 60,
      lastUpdatedTime: Date.now()
    };

    // Update the timer state to ensure we're in a work session
    console.log('Resetting timer to work session when selecting project');
    handleTimerStateChange(workSessionTimerState);

    // If the project is not in 'working' status, set it as working
    if (project && project.status !== 'working') {
      const projectId = isAuthenticated() ? project._id : project.id;

      if (isAuthenticated()) {
        // Update via API
        projectApi.setProjectAsWorking(projectId)
          .then(updatedProject => {
            // Refresh projects
            return projectApi.getProjects('open,working');
          })
          .then(fetchedProjects => {
            setProjects(fetchedProjects);
            // Find and set the updated project
            const updatedProject = fetchedProjects.find(p =>
              isAuthenticated() ? p._id === projectId : p.id === projectId
            );
            if (updatedProject) {
              setActiveProject(updatedProject);
            }
          })
          .catch(err => console.error('Error setting project as working:', err));
      } else {
        // Update localStorage
        const savedProjects = localStorage.getItem('pomodoroProjects');
        const parsedProjects = savedProjects ? JSON.parse(savedProjects) : [];

        // Reset any working project
        const updatedProjects = parsedProjects.map(p => ({
          ...p,
          status: p.status === 'working' ? 'open' : p.status
        }));

        // Set the selected project as working
        const finalProjects = updatedProjects.map(p => ({
          ...p,
          status: p.id === projectId ? 'working' : p.status
        }));

        localStorage.setItem('pomodoroProjects', JSON.stringify(finalProjects));

        // Update state
        const openProjects = finalProjects.filter(p =>
          p.status === 'open' || p.status === 'working'
        );
        setProjects(openProjects);

        // Find and set the updated project
        const updatedProject = finalProjects.find(p => p.id === projectId);
        if (updatedProject) {
          setActiveProject(updatedProject);
        }
      }
    }
  };

  // Handle task completion
  const handleTaskCompleted = async (taskId) => {
    if (user) {
      try {
        await taskApi.updateTask(taskId, { completed: true });
      } catch (error) {
        console.error('Error completing task:', error);
      }
    } else {
      setStats(prev => ({
        ...prev,
        completedTasks: prev.completedTasks + 1
      }));
    }
  };

  // Handle Todoist task import
  const handleImportTasks = async (tasks) => {
    if (user) {
      try {
        await taskApi.importTodoistTasks(tasks);
      } catch (error) {
        console.error('Error importing tasks:', error);
      }
    } else {
      // Implementation for local storage
      console.log('Imported tasks:', tasks);
    }
  };

  // Handle active task change
  const handleActiveTaskChange = async (taskId, taskData = null) => {
    console.log('handleActiveTaskChange called with taskId:', taskId, 'and taskData:', taskData);

    // Check if this task change is coming from the project detail page
    const fromProjectDetail = window.fromProjectDetail === true;
    console.log('Task change is from project detail page:', fromProjectDetail);

    // Extract project ID from task data if available
    let projectId = null;
    if (taskData) {
      projectId = taskData.projectId ||
        (taskData.project ?
          (typeof taskData.project === 'object' ?
            (taskData.project._id || taskData.project.id) :
            taskData.project) :
          null);
    }

    // Extract task and project names for the warning message
    const taskName = taskData ? (taskData.title || taskData.name || 'this task') : 'this task';
    let projectName = 'this project';

    // Try to get project name from task data
    if (taskData && taskData.project && typeof taskData.project === 'object') {
      projectName = taskData.project.title || taskData.project.name || 'this project';
    }

    // Dispatch event to notify the timer context about the task change
    console.log('AppWithAuth: Dispatching activeTaskChanged event with taskId:', taskId, 'projectId:', projectId);
    window.dispatchEvent(new CustomEvent('activeTaskChanged', {
      detail: {
        taskId: taskId,
        projectId: projectId,
        taskName: taskName,
        projectName: projectName,
        fromProjectDetail: fromProjectDetail
      }
    }));

    // If no taskId, clear the active task
    if (!taskId) {
      console.log('Clearing active task');

      // For authenticated users, clear the active task in the database
      if (isAuthenticated()) {
        try {
          console.log('Clearing active task in database');
          await userApi.setActiveTask(null);
        } catch (error) {
          console.error('Error clearing active task in database:', error);
        }
      }

      // Update local state
      setActiveTaskId(null);
      setGlobalActiveTask(null);

      // Clear localStorage as fallback
      localStorage.removeItem('pomodoroActiveTaskId');
      localStorage.removeItem('activeTaskCache');
      return; // Exit early
    }

    // Set the active task ID in local state
    setActiveTaskId(taskId);

    // If taskData is provided, immediately set it as the global active task
    if (taskData) {
      console.log('Immediately setting globalActiveTask from provided taskData:', taskData);
      setGlobalActiveTask(taskData);

      // For authenticated users, update the active task in the database
      if (isAuthenticated()) {
        try {
          console.log('Saving active task to database with taskId:', taskId);
          await userApi.setActiveTask(taskId);
        } catch (error) {
          console.error('Error saving active task to database:', error);
          // Continue with localStorage as fallback
        }
      } else {
        // For non-authenticated users, save to localStorage
        localStorage.setItem('activeTaskCache', JSON.stringify(taskData));
        localStorage.setItem('pomodoroActiveTaskId', taskId);
      }

      // Skip the rest of the function since we already have the data
      return;
    }

    if (isAuthenticated()) {
      try {
        // Update global active task in database
        const userData = await userApi.setActiveTask(taskId);
        if (userData.activeTask) {
          console.log('Setting globalActiveTask from API response:', userData.activeTask);
          setGlobalActiveTask(userData.activeTask);

          // Cache the active task in localStorage for persistence between tab switches
          localStorage.setItem('activeTaskCache', JSON.stringify(userData.activeTask));
        } else {
          console.log('Clearing globalActiveTask (API returned no active task)');
          setGlobalActiveTask(null);
          localStorage.removeItem('activeTaskCache');
        }
      } catch (error) {
        console.error('Error updating active task:', error);

        // Fallback to localStorage if API call fails
        if (taskId && taskData) {
          console.log('Setting globalActiveTask from taskData (API failed):', taskData);
          setGlobalActiveTask(taskData);
          localStorage.setItem('activeTaskCache', JSON.stringify(taskData));
        } else if (taskId) {
          // Try to find the task in localStorage
          const tasksJson = localStorage.getItem('pomodoroTasks');
          if (tasksJson) {
            try {
              const allTasks = JSON.parse(tasksJson);
              const task = allTasks.find(t => t.id === taskId || t._id === taskId);
              if (task) {
                console.log('Setting globalActiveTask from localStorage (API failed):', task);
                setGlobalActiveTask(task);
                localStorage.setItem('activeTaskCache', JSON.stringify(task));
              }
            } catch (e) {
              console.error('Error parsing tasks from localStorage:', e);
            }
          }
        }
      }
    } else {
      // For non-authenticated users, save to localStorage
      if (taskId) {
        localStorage.setItem('pomodoroActiveTaskId', taskId);
        // If task data is provided, update the local state and cache
        if (taskData) {
          console.log('Setting globalActiveTask for non-authenticated user:', taskData);
          setGlobalActiveTask(taskData);
          localStorage.setItem('activeTaskCache', JSON.stringify(taskData));
        } else {
          // Try to find the task in localStorage
          const tasksJson = localStorage.getItem('pomodoroTasks');
          if (tasksJson) {
            try {
              const allTasks = JSON.parse(tasksJson);
              const task = allTasks.find(t => t.id === taskId || t._id === taskId);
              if (task) {
                console.log('Setting globalActiveTask from localStorage (no taskData provided):', task);
                setGlobalActiveTask(task);
                localStorage.setItem('activeTaskCache', JSON.stringify(task));
              }
            } catch (e) {
              console.error('Error parsing tasks from localStorage:', e);
            }
          }
        }
      } else {
        console.log('Clearing globalActiveTask (no taskId provided)');
        localStorage.removeItem('pomodoroActiveTaskId');
        localStorage.removeItem('activeTaskCache');
        setGlobalActiveTask(null);
      }
    }
  };

  // Handle switching to the active task
  const handleSwitchToActiveTask = async (task, switchToTimerTab = false) => {
    if (!task) return;

    console.log('Switching to active task:', task);

    // Check if this task change is coming from the project detail page
    const fromProjectDetail = window.fromProjectDetail === true;
    console.log('Task change is from project detail page:', fromProjectDetail);

    const taskId = task._id || task.id;

    // Extract project ID from task data if available
    let projectId = task.projectId ||
      (task.project ?
        (typeof task.project === 'object' ?
          (task.project._id || task.project.id) :
          task.project) :
        null);

    // Extract task and project names for the warning message
    const taskName = task.title || task.name || 'this task';
    let projectName = 'this project';

    // Try to get project name from task data
    if (task.project && typeof task.project === 'object') {
      projectName = task.project.title || task.project.name || 'this project';
    }

    // Dispatch event to notify the timer context about the task change
    console.log('AppWithAuth: Dispatching activeTaskChanged event with taskId:', taskId, 'projectId:', projectId);
    window.dispatchEvent(new CustomEvent('activeTaskChanged', {
      detail: {
        taskId: taskId,
        projectId: projectId,
        taskName: taskName,
        projectName: projectName,
        fromProjectDetail: fromProjectDetail
      }
    }));

    // Set the active task ID in local state
    setActiveTaskId(taskId);

    // Set the global active task in local state
    setGlobalActiveTask(task);

    // For authenticated users, update the active task in the database
    if (isAuthenticated()) {
      try {
        console.log('Saving active task to database when switching tasks:', taskId);
        await userApi.setActiveTask(taskId);
      } catch (error) {
        console.error('Error updating active task in database:', error);
        // Continue with localStorage as fallback
        localStorage.setItem('activeTaskCache', JSON.stringify(task));
        localStorage.setItem('pomodoroActiveTaskId', taskId);
      }
    } else {
      // For non-authenticated users, save to localStorage
      localStorage.setItem('activeTaskCache', JSON.stringify(task));
      localStorage.setItem('pomodoroActiveTaskId', taskId);
    }

    // If the task has a project, switch to that project
    if (task.project) {
      // Find the project in the projects list
      const projectId = typeof task.project === 'object' ? task.project._id : task.project;
      const project = projects.find(p =>
        (p._id && p._id.toString() === projectId.toString()) ||
        (p.id && p.id.toString() === projectId.toString())
      );

      if (project) {
        handleSelectProject(project);
      }
    }
  };



  // Remove a notification
  const removeNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Handle login
  const handleLogin = async (userData) => {
    console.log('Login successful, user data:', userData);

    // Make sure we have the isAdmin flag in the user data
    console.log('Is admin?', userData.user.isAdmin);

    setUser(userData.user);

    // Load user settings if available
    if (userData.user.settings) {
      setSettings(userData.user.settings);
    }

    // Clear any existing task data from previous sessions
    setGlobalActiveTask(null);
    setActiveTaskId(null);

    // Load the user's active task from the server
    try {
      console.log('Loading active task from server after login');
      const { activeTask } = await userApi.getActiveTask();

      if (activeTask) {
        console.log('Setting active task from server after login:', activeTask);
        setGlobalActiveTask(activeTask);
        setActiveTaskId(activeTask._id);

        // Cache the active task
        localStorage.setItem('activeTaskCache', JSON.stringify(activeTask));
        localStorage.setItem('pomodoroActiveTaskId', activeTask._id);
      } else {
        console.log('No active task found on server after login');
        // Clear any cached task
        localStorage.removeItem('activeTaskCache');
        localStorage.removeItem('pomodoroActiveTaskId');
      }
    } catch (error) {
      console.error('Error loading active task after login:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading...</LoadingText>
        </LoadingContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Routes>
            <Route path="/" element={
              isAuthenticated() ? <Navigate to="/app" replace state={{ activeTab: 'pomodoro' }} /> : <AppFlowyStyleLandingPage />
            } />
            <Route path="/classic" element={<LandingPage />} />
            <Route path="/old" element={<GmailStyleLandingPage />} />
            <Route path="/gmail" element={<GmailStyleNewLandingPage />} />
            <Route path="/login" element={
              isAuthenticated() ? <Navigate to="/app" replace state={{ activeTab: 'pomodoro' }} /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={
              isAuthenticated() ? <Navigate to="/app" replace state={{ activeTab: 'pomodoro' }} /> : <Register onLogin={handleLogin} />
            } />
            <Route path="/forgot-password" element={
              isAuthenticated() ? <Navigate to="/app" replace state={{ activeTab: 'pomodoro' }} /> : <ForgotPassword />
            } />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/test-pomodoro" element={<TestPomodoroPage />} />
            <Route path="/pomodoro-test" element={<TestPomodoroPage />} />
            <Route path="/pomodoro" element={<Navigate to="/app" replace state={{ activeTab: 'pomodoro' }} />} />

            <Route path="/app" element={
              <ProtectedRoute>
                <>
                  <Header
                    user={user}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    openSettings={openSettings}
                    onLogout={handleLogout}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />

                  <MainContent>
                    {activeTab === 'projects' && (
                      <ProjectList
                        onSelectProject={handleSelectProject}
                        activeProjectId={activeProject ? (isAuthenticated() ? activeProject._id : activeProject.id) : null}
                        activeProject={activeProject}
                        timerState={timerState}
                        settings={settings}
                        onTimerStateChange={handleTimerStateChange}
                        onPomodoroCompleted={handlePomodoroCompleted}
                        activeTaskId={activeTaskId}
                        onTaskCompleted={handleTaskCompleted}
                        onActiveTaskChange={handleActiveTaskChange}
                      />
                    )}

                    {activeTab === 'pomodoro' && <StandalonePomodoroPage />}

                    {activeTab === 'stats' && <Statistics stats={stats} />}

                    {activeTab === 'calendar' && <Calendar />}

                    {activeTab === 'ai' && <AIProjectGenerator />}



                    {activeTab === 'admin' && user?.isAdmin && <AdminPage />}
                  </MainContent>

                  {/* Settings component */}
                  <Settings
                    isOpen={isSettingsOpen}
                    onClose={closeSettings}
                  />

                  {/* Disabled feature modal that will be shown instead of settings */}
                  <DisabledFeatureModal
                    isOpen={isDisabledFeatureModalOpen}
                    onClose={closeDisabledFeatureModal}
                    featureName="Settings"
                    message="The Settings feature will be available in a future release. We're working on making your timer experience fully customizable!"
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
                </>
              </ProtectedRoute>
            } />
          </Routes>
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
`;

const MainContent = styled.main`
  padding: 2rem 1rem 4rem;
  margin: 0 auto;
  width: 100%;

  /* Make calendar view full width */
  & > div:has(.CalendarView) {
    width: 100%;
    max-width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${props => props.theme['--bg-color']};
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #d95550;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  font-size: 1.2rem;
  color: ${props => props.theme['--text-color']};
`;





// Wrapper component to handle location state
const AppWithLocation = () => {
  const location = useLocation();

  // Check if we have state from a redirect
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      // Set the active tab based on the state
      window.initialActiveTab = location.state.activeTab;
    }
  }, [location]);

  return <App />;
};

// Wrap App with GlobalTimerProvider and SettingsProvider
const AppWithProviders = () => (
  <SettingsProvider>
    <GlobalTimerProvider>
      <Router>
        <AppWithLocation />
      </Router>
    </GlobalTimerProvider>
  </SettingsProvider>
);

export default AppWithProviders;
