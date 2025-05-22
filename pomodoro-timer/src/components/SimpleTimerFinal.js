import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useGlobalTimer } from '../contexts/GlobalTimerContext';
import { useSettings } from '../context/SettingsContext';

/**
 * A simple timer component that uses a basic approach for accurate timing
 * This implementation is inspired by BigTimer.net and other reliable timer websites
 * Now uses a global timer context for synchronization across components
 * Enhanced with project and task-specific functionality
 */
const SimpleTimerFinal = ({
  onComplete,
  compact = false,
  projectId = null,
  taskId = null,
  projectName = null,
  taskName = null,
  projectDescription = null
}) => {
  // Get timer state and functions from context first
  const {
    isRunning,
    isPaused,
    timeRemaining,
    currentSession,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    getSessionDuration
  } = useGlobalTimer();

  // Get settings from context
  const settingsContext = useSettings();
  const settings = React.useMemo(() => settingsContext?.settings || {
    workTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4
  }, [settingsContext?.settings]);

  // Log settings when they change and update timer if needed
  useEffect(() => {
    console.log('SimpleTimerFinal: Settings updated:', settings);

    // If timer is not running, update the time remaining based on current session
    if (!isRunning && !isPaused && currentSession) {
      const newDuration = getSessionDuration(currentSession);
      console.log(`SimpleTimerFinal: Updating timer duration to ${newDuration} seconds based on new settings`);

      // Force a refresh of the timer display
      const event = new CustomEvent('forceTimerRefresh', {
        detail: {
          session: currentSession,
          duration: newDuration
        }
      });
      window.dispatchEvent(event);
    }
  }, [settings, isRunning, isPaused, currentSession, getSessionDuration]);

  // Local state for total pomodoros today (commented out as it's not currently used)
  // const [totalPomodorosToday, setTotalPomodorosToday] = useState(0);

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // State for refresh warning
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  // Request notification permission when component mounts
  useEffect(() => {
    if ('Notification' in window) {
      console.log('SimpleTimerFinal: Current notification permission:', Notification.permission);
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        console.log('SimpleTimerFinal: Requesting notification permission');
        Notification.requestPermission().then(permission => {
          console.log(`SimpleTimerFinal: Notification permission ${permission}`);

          // Show a test notification if permission was granted
          if (permission === 'granted') {
            try {
              new Notification('Notification Test', {
                body: 'Notifications are now enabled for AI Pomo!',
                icon: '/favicon.ico'
              });
              console.log('SimpleTimerFinal: Test notification shown successfully');
            } catch (error) {
              console.error('SimpleTimerFinal: Error showing test notification:', error);
            }
          }
        });
      }
    } else {
      console.log('SimpleTimerFinal: Notifications not supported in this browser');
    }
  }, []);

  // State for timer conflict warning
  const [hasTimerConflict, setHasTimerConflict] = useState(false);
  const [conflictProjectId, setConflictProjectId] = useState(null);
  const [conflictTaskId, setConflictTaskId] = useState(null);

  // Handle beforeunload event to warn users before page refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // If timer is running or paused, show a warning message
      if (isRunning || isPaused) {
        // Show a warning message to the user
        const message = "Warning: Refreshing the page will reset your timer. Are you sure you want to continue?";
        event.preventDefault();
        event.returnValue = message; // Standard for most browsers

        console.log(`SimpleTimerFinal: Showing refresh warning - isRunning: ${isRunning}, isPaused: ${isPaused}`);

        return message; // For older browsers
      }
    };

    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up
    return () => {
      isMounted.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, isPaused]);

  // Prevent refresh shortcuts (F5, Ctrl+R)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // If timer is running or paused, prevent refresh shortcuts
      if (isRunning || isPaused) {
        // F5 key
        if (event.key === 'F5') {
          event.preventDefault();
          console.log('SimpleTimerFinal: Prevented F5 refresh');

          // Show a warning toast or alert
          setShowRefreshWarning(true);
          setTimeout(() => setShowRefreshWarning(false), 3000);
          return false;
        }

        // Ctrl+R or Command+R (refresh)
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
          event.preventDefault();
          console.log('SimpleTimerFinal: Prevented Ctrl+R refresh');

          // Show a warning toast or alert
          setShowRefreshWarning(true);
          setTimeout(() => setShowRefreshWarning(false), 3000);
          return false;
        }
      }
    };

    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, isPaused]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
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

  // Start the timer
  const handleStartTimer = () => {
    // Check if this is a standalone timer (no projectId)
    const isStandalone = !projectId;

    // For non-standalone timers, check if we have a task selected for work sessions
    if (!isStandalone && currentSession === 'work') {
      if (!taskName && !taskId) {
        alert('Please select a task before starting a focus session. You can select a task from the task list in the project detail page.');
        return;
      }

      // If the task belongs to a different project, show a warning
      if (taskFromDifferentProject) {
        // Double-check the task project ID one more time before showing the warning
        try {
          const activeTaskCache = localStorage.getItem('activeTaskCache');
          if (activeTaskCache) {
            const parsedTask = JSON.parse(activeTaskCache);

            // Extract project ID from task data, handling different formats
            let taskProjectId = null;

            if (parsedTask.projectId) {
              taskProjectId = parsedTask.projectId;
            } else if (parsedTask.project) {
              if (typeof parsedTask.project === 'object') {
                taskProjectId = parsedTask.project._id || parsedTask.project.id;
              } else {
                taskProjectId = parsedTask.project;
              }
            }

            // Normalize IDs for comparison
            const normalizedTaskProjectId = String(taskProjectId || '');
            const normalizedProjectId = String(projectId || '');

            console.log('Last-minute check - Task project ID:', normalizedTaskProjectId);
            console.log('Last-minute check - Current project ID:', normalizedProjectId);

            // If the IDs match or taskProjectId is empty/null, proceed with starting the timer
            if (normalizedTaskProjectId === normalizedProjectId || !taskProjectId || taskProjectId.toString().trim() === '') {
              console.log('Last-minute check: Task belongs to the current project or has no project ID!');
              // We'll proceed with starting the timer
            } else {
              alert('The selected task belongs to a different project. Please select a task from the current project.');
              return;
            }
          } else {
            alert('The selected task belongs to a different project. Please select a task from the current project.');
            return;
          }
        } catch (error) {
          console.error('Error in last-minute task project check:', error);
          alert('The selected task belongs to a different project. Please select a task from the current project.');
          return;
        }
      }
    }

    // Don't pass a duration to force using the latest settings from the database
    console.log(`Starting timer for ${currentSession} session with latest settings from database${isStandalone ? ' (standalone)' : ''}`);

    // Start the timer with the current session type, but don't specify duration
    // This will force the timer to use the latest settings from the database
    startTimer(null, onComplete, currentSession, projectId, taskId, isStandalone);

    // Set the isStandalone flag in the global timer state for conflict detection
    if (window.globalTimerState) {
      window.globalTimerState.isStandalone = isStandalone;
    }
  };

  // Handle pause
  const handlePauseTimer = () => {
    pauseTimer();
  };

  // Handle resume
  const handleResumeTimer = () => {
    resumeTimer();
  };

  // Handle reset
  const handleResetTimer = () => {
    resetTimer();
  };

  // Handle skip
  const handleSkipSession = () => {
    skipTimer(onComplete);
  };

  // Handle stop timer (for timer conflict)
  const handleStopTimer = () => {
    // For standalone timer conflicts, conflictProjectId will be null but we still want to stop the timer
    // So we only check if we have a timer conflict at all
    if (!hasTimerConflict) return;

    // Show confirmation dialog
    const confirmed = window.confirm("Stopping the timer will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

    if (!confirmed) {
      console.log('SimpleTimerFinal: User cancelled stopping timer');
      return;
    }

    console.log('SimpleTimerFinal: User confirmed stopping timer, resetting timer');

    // First, try to use the resetTimer function from the context
    if (resetTimer) {
      console.log('SimpleTimerFinal: Resetting timer using context resetTimer function');
      resetTimer();
    }

    // Also try the global timer state update function as a backup
    if (window.updateGlobalTimerState) {
      // Reset the timer directly using the global function
      window.updateGlobalTimerState({
        isRunning: false,
        isPaused: false,
        timeRemaining: getSessionDuration('work'),
        currentSession: 'work',
        projectId: null,
        taskId: null,
        isStandalone: false
      });

      console.log('SimpleTimerFinal: Reset timer using global timer state update function');
    }

    // Also reset the timer by dispatching an event to clear the active task
    window.dispatchEvent(new CustomEvent('activeTaskChanged', {
      detail: {
        taskId: null,
        projectId: null,
        taskName: null,
        projectName: null
      }
    }));

    // Clear the conflict state
    setHasTimerConflict(false);
    setConflictProjectId(null);
    setConflictTaskId(null);
  };

  // Handle view timer (for timer conflict)
  const handleViewTimer = () => {
    if (conflictProjectId) {
      // Navigate to the project with the running timer
      console.log('SimpleTimerFinal: Navigating to project with running timer:', conflictProjectId);

      // Store the project ID to navigate to
      localStorage.setItem('navigateToProjectId', conflictProjectId);

      // Dispatch an event to navigate to the project
      window.dispatchEvent(new CustomEvent('navigateToProject', {
        detail: {
          projectId: conflictProjectId
        }
      }));
    } else {
      // Navigate to the standalone pomodoro page
      console.log('SimpleTimerFinal: Navigating to standalone pomodoro page');

      // Set the active tab to 'pomodoro'
      if (typeof window.setActiveTab === 'function') {
        window.setActiveTab('pomodoro');
      } else {
        // Fallback to direct navigation
        localStorage.setItem('lastActiveTab', 'pomodoro');
        window.location.href = '/app';
      }
    }
  };

  // Check for timer conflicts
  useEffect(() => {
    const checkTimerConflict = () => {
      // Only check for conflicts if not in compact mode
      if (compact) {
        return;
      }

      // Get the global timer state
      const globalState = window.globalTimerState;

      if (!globalState) {
        setHasTimerConflict(false);
        return;
      }

      // Check if there's a running timer
      if ((globalState.isRunning || globalState.isPaused) && globalState.currentSession === 'work') {
        // Case 1: We're in a project detail view and there's a timer running for a different project
        if (projectId && globalState.projectId && globalState.projectId !== projectId) {
          console.log('SimpleTimerFinal: Timer conflict detected - different project!');
          console.log('Current project:', projectId);
          console.log('Timer running for project:', globalState.projectId);

          setHasTimerConflict(true);
          setConflictProjectId(globalState.projectId);
          setConflictTaskId(globalState.taskId);
          return;
        }

        // Case 2: We're in standalone pomodoro page (no projectId) and there's a project timer running
        if (!projectId && globalState.projectId) {
          console.log('SimpleTimerFinal: Timer conflict detected - project timer running in standalone view!');
          console.log('Timer running for project:', globalState.projectId);

          setHasTimerConflict(true);
          setConflictProjectId(globalState.projectId);
          setConflictTaskId(globalState.taskId);
          return;
        }

        // Case 3: We're in a project detail view and there's a standalone timer running
        if (projectId && !globalState.projectId && globalState.isStandalone) {
          console.log('SimpleTimerFinal: Timer conflict detected - standalone timer running in project view!');

          setHasTimerConflict(true);
          setConflictProjectId(null); // No project ID for standalone timer
          setConflictTaskId(globalState.taskId);
          return;
        }
      }

      // No conflict detected
      setHasTimerConflict(false);
      setConflictProjectId(null);
      setConflictTaskId(null);
    };

    // Check for conflicts immediately
    checkTimerConflict();

    // Set up interval to check for conflicts periodically
    const intervalId = setInterval(checkTimerConflict, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [compact, projectId]);

  // Load total pomodoros for today (commented out as we're not using totalPomodorosToday)
  /*
  useEffect(() => {
    const loadTotalPomodoros = async () => {
      if (isAuthenticated()) {
        try {
          // Get today's date in YYYY-MM-DD format
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

          // Get pomodoros for today
          const pomodoros = await pomodoroApi.getPomodoros(today, tomorrow);

          // Set total pomodoros
          setTotalPomodorosToday(pomodoros.length);
        } catch (error) {
          console.error('Error loading total pomodoros:', error);
        }
      }
    };

    loadTotalPomodoros();
  }, [pomodoroCount]);
  */

  // State to track if task is from a different project
  const [taskFromDifferentProject, setTaskFromDifferentProject] = useState(false);

  // Check if task belongs to current project when component mounts or when taskId/projectId changes
  useEffect(() => {
    // Immediately set taskFromDifferentProject to false when projectId changes
    // This prevents the brief flash of warning when switching to the correct project
    if (projectId) {
      setTaskFromDifferentProject(false);
    }

    const checkTaskProject = async () => {
      // Only check if we have both a project and a task
      if (projectId && taskId) {
        console.log('SimpleTimerFinal: Checking if task belongs to current project');
        console.log('Current projectId:', projectId, 'type:', typeof projectId);
        console.log('Current taskId:', taskId, 'type:', typeof taskId);

        try {
          // Try to get the task's project ID from localStorage first
          const activeTaskCache = localStorage.getItem('activeTaskCache');
          if (activeTaskCache) {
            try {
              const parsedTask = JSON.parse(activeTaskCache);
              console.log('Active task cache data:', parsedTask);

              // Extract project ID from task data, handling different formats
              let taskProjectId = null;

              // Direct projectId property
              if (parsedTask.projectId) {
                taskProjectId = parsedTask.projectId;
              }
              // Project object reference
              else if (parsedTask.project) {
                if (typeof parsedTask.project === 'object') {
                  taskProjectId = parsedTask.project._id || parsedTask.project.id;
                } else {
                  taskProjectId = parsedTask.project;
                }
              }

              console.log('Task project ID from cache:', taskProjectId, 'type:', typeof taskProjectId);
              console.log('Current project ID:', projectId, 'type:', typeof projectId);

              // Normalize IDs for comparison (handle string vs object ID)
              const normalizedTaskProjectId = String(taskProjectId || '');
              const normalizedProjectId = String(projectId || '');

              console.log('Normalized task project ID:', normalizedTaskProjectId);
              console.log('Normalized current project ID:', normalizedProjectId);

              // If the IDs match, immediately set taskFromDifferentProject to false
              if (normalizedTaskProjectId === normalizedProjectId) {
                console.log('Task belongs to the current project - clearing warning flag immediately');
                setTaskFromDifferentProject(false);
                return;
              }

              // Compare normalized IDs - only if taskProjectId exists and is not empty
              if (taskProjectId && taskProjectId.toString().trim() !== '' && normalizedTaskProjectId !== normalizedProjectId) {
                console.log('Task is from a different project!');
                setTaskFromDifferentProject(true);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing active task cache:', parseError);
              // Continue with other checks
            }
          }

          // If we couldn't determine from cache, check the global state
          if (window.globalTimerState && window.globalTimerState.projectId) {
            const globalProjectId = window.globalTimerState.projectId;
            console.log('Global project ID:', globalProjectId, 'type:', typeof globalProjectId);

            // Normalize IDs for comparison
            const normalizedGlobalProjectId = String(globalProjectId || '');
            const normalizedProjectId = String(projectId || '');

            console.log('Normalized global project ID:', normalizedGlobalProjectId);
            console.log('Normalized current project ID:', normalizedProjectId);

            // If the IDs match, immediately set taskFromDifferentProject to false
            if (normalizedGlobalProjectId === normalizedProjectId) {
              console.log('Task belongs to the current project (from global state) - clearing warning flag immediately');
              setTaskFromDifferentProject(false);
              return;
            }

            if (globalProjectId && globalProjectId.toString().trim() !== '' && normalizedGlobalProjectId !== normalizedProjectId) {
              console.log('Task is from a different project (from global state)!');
              setTaskFromDifferentProject(true);
              return;
            }
          }

          // If we get here, the task is from the current project
          console.log('Task belongs to the current project - clearing warning flag');
          setTaskFromDifferentProject(false);
        } catch (error) {
          console.error('Error checking task project:', error);
          setTaskFromDifferentProject(false);
        }
      } else {
        // If we don't have both projectId and taskId, reset the state
        setTaskFromDifferentProject(false);
      }
    };

    // Run the check immediately
    checkTaskProject();

    // Also set up a retry mechanism to handle race conditions
    // Use a shorter timeout to reduce the flash of warning
    const retryTimeout = setTimeout(() => {
      console.log('SimpleTimerFinal: Running delayed task project check to handle race conditions');
      checkTaskProject();
    }, 300);

    return () => clearTimeout(retryTimeout);
  }, [projectId, taskId]);

  // We directly use the taskFromDifferentProject state variable in the component

  // Calculate progress percentage
  const sessionDuration = getSessionDuration(currentSession);
  const progress = (timeRemaining / sessionDuration) * 100;

  // Debug output for task project check and force a re-check when component mounts
  useEffect(() => {
    if (taskFromDifferentProject) {
      console.log('SimpleTimerFinal: Task is from a different project - showing warning');
    } else {
      console.log('SimpleTimerFinal: Task is from the current project or no task selected');
    }
  }, [taskFromDifferentProject]);

  // Listen for active task change events
  useEffect(() => {
    const handleActiveTaskChanged = (event) => {
      console.log('SimpleTimerFinal: Active task changed event detected');

      // Get the new task and project IDs from the event
      const { taskId: newTaskId, projectId: newProjectId } = event.detail;

      // If we're in the same project as the new active task, immediately clear the warning
      if (projectId && newProjectId && String(projectId) === String(newProjectId)) {
        console.log('SimpleTimerFinal: New active task is in the current project - clearing warning immediately');
        setTaskFromDifferentProject(false);
      }
      // If the active task was cleared, also clear the warning
      else if (!newTaskId) {
        console.log('SimpleTimerFinal: Active task was cleared - clearing warning');
        setTaskFromDifferentProject(false);
      }
    };

    // Add event listener for active task changes
    window.addEventListener('activeTaskChanged', handleActiveTaskChanged);

    // Clean up
    return () => {
      window.removeEventListener('activeTaskChanged', handleActiveTaskChanged);
    };
  }, [projectId]);

  // Add an effect to handle the case where taskName and taskId are provided but no active task is in cache
  useEffect(() => {
    if (taskId && taskName && !localStorage.getItem('activeTaskCache')) {
      console.log('SimpleTimerFinal: taskId and taskName provided but no active task in cache');

      // Create a minimal task object and store it in cache to ensure the task is displayed
      const minimalTask = {
        _id: taskId,
        id: taskId, // Include both formats to be safe
        title: taskName,
        name: taskName, // Include both formats to be safe
        projectId: projectId
      };

      // If we have project information, add it
      if (projectId && projectName) {
        minimalTask.project = {
          _id: projectId,
          id: projectId, // Include both formats to be safe
          title: projectName,
          name: projectName // Include both formats to be safe
        };
      }

      console.log('SimpleTimerFinal: Storing minimal task in cache:', minimalTask);
      localStorage.setItem('activeTaskCache', JSON.stringify(minimalTask));
      localStorage.setItem('pomodoroActiveTaskId', taskId);
    }
  }, [taskId, taskName, projectId, projectName]);

  // Force a re-check of task project when component mounts and add a retry mechanism
  useEffect(() => {
    // Only run this once when the component mounts
    if (projectId && taskId) {
      console.log('SimpleTimerFinal: Component mounted - forcing task project check');

      // Immediately set taskFromDifferentProject to false when projectId changes
      // This prevents the brief flash of warning when switching to the correct project
      setTaskFromDifferentProject(false);

      const checkTaskProjectOnMount = () => {
        // Try to get the task's project ID from localStorage
        try {
          const activeTaskCache = localStorage.getItem('activeTaskCache');
          if (activeTaskCache) {
            try {
              const parsedTask = JSON.parse(activeTaskCache);

              // Extract project ID from task data, handling different formats
              let taskProjectId = null;

              if (parsedTask.projectId) {
                taskProjectId = parsedTask.projectId;
              } else if (parsedTask.project) {
                if (typeof parsedTask.project === 'object') {
                  taskProjectId = parsedTask.project._id || parsedTask.project.id;
                } else {
                  taskProjectId = parsedTask.project;
                }
              }

              // Normalize IDs for comparison
              const normalizedTaskProjectId = String(taskProjectId || '');
              const normalizedProjectId = String(projectId || '');

              console.log('Initial check - Task project ID:', normalizedTaskProjectId);
              console.log('Initial check - Current project ID:', normalizedProjectId);

              // If the IDs match, immediately ensure taskFromDifferentProject is false
              if (normalizedTaskProjectId === normalizedProjectId) {
                console.log('Initial check: Task belongs to the current project - ensuring warning flag is cleared');
                setTaskFromDifferentProject(false);
                return;
              }

              // Set the state based on the comparison - only if taskProjectId exists and is not empty
              if (taskProjectId && taskProjectId.toString().trim() !== '' && normalizedTaskProjectId !== normalizedProjectId) {
                console.log('Initial check: Task is from a different project!');
                setTaskFromDifferentProject(true);
              } else {
                setTaskFromDifferentProject(false);
              }

              // If we have a task name from props but no task name in the cache, try to update the display
              if (taskName && (!parsedTask.title && !parsedTask.name)) {
                console.log('Task name provided in props but not in cache, updating display');
                // We don't need to do anything here as the component will use the taskName prop
              }
            } catch (parseError) {
              console.error('Error parsing active task cache in initial check:', parseError);
            }
          } else if (taskId) {
            // If we have a taskId but no cache, try to fetch the task data
            console.log('No active task cache found, but taskId is provided. Using taskName from props if available.');
            // The component will use the taskName prop if available
          }
        } catch (error) {
          console.error('Error in initial task project check:', error);
        }
      };

      // Run the check immediately
      checkTaskProjectOnMount();

      // Also set up a retry mechanism to handle race conditions
      // Use a shorter timeout to reduce the flash of warning
      const retryTimeout = setTimeout(() => {
        console.log('SimpleTimerFinal: Running delayed initial task project check');
        checkTaskProjectOnMount();
      }, 300);

      return () => clearTimeout(retryTimeout);
    }
  }, [projectId, taskId, taskName]); // Include taskName in the dependency array

  // Render a compact version for the header if compact prop is true
  if (compact) {
    return (
      <CompactTimerContainer>
        <CompactTimerDisplay>
          <CompactTimerTime>{formatTime(timeRemaining)}</CompactTimerTime>
          <CompactSessionEmoji>{getSessionEmoji()}</CompactSessionEmoji>
        </CompactTimerDisplay>
      </CompactTimerContainer>
    );
  }

  // Render the full timer for the main content
  return (
    <>
      <TimerContainer>
        {showRefreshWarning && (
          <RefreshWarning>
            <span role="img" aria-label="warning" style={{ marginRight: '10px' }}>⚠️</span>
            Refreshing the page will reset your timer!
          </RefreshWarning>
        )}

        <SessionName session={currentSession}>
          {currentSession === 'work' ? 'Focus Time' : currentSession === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </SessionName>

        <TimerDisplay>
          <TimerCircle
            progress={progress}
            session={currentSession}
            isRunning={isRunning}
            isPaused={isPaused}
          >
            <TimerTime isRunning={isRunning}>{formatTime(timeRemaining)}</TimerTime>
            <SessionEmoji>{getSessionEmoji()}</SessionEmoji>
            {/* Removed all overlay warnings since we have warnings at the bottom */}
            {hasTimerConflict && (
              <TimerConflictOverlay>
                <ConflictWarningText>
                  {conflictProjectId
                    ? "There is a running timer for another project"
                    : "There is a standalone timer running"}
                </ConflictWarningText>
                <ConflictButtonsContainer>
                  <StopTimerButton onClick={handleStopTimer}>
                    Stop Timer
                  </StopTimerButton>
                  <ViewTimerButton onClick={handleViewTimer}>
                    View Timer
                  </ViewTimerButton>
                </ConflictButtonsContainer>
              </TimerConflictOverlay>
            )}
          </TimerCircle>
        </TimerDisplay>

        {/* Permanent warning removed as requested */}

        {currentSession === 'work' && (
          <PomodoroCount>
            Pomodoro {pomodoroCount === 0 ? 1 : ((pomodoroCount - 1) % settings.longBreakInterval) + 1} / {settings.longBreakInterval}
            <PomodoroCountTooltip>
              {pomodoroCount} completed, {pomodoroCount === 0 ? settings.longBreakInterval : (settings.longBreakInterval - ((pomodoroCount - 1) % settings.longBreakInterval))} until long break
            </PomodoroCountTooltip>
          </PomodoroCount>
        )}

        {/* Debug info - can be removed in production */}
        <DebugInfo>
          Total completed: {pomodoroCount}, Long break after: {settings.longBreakInterval},
          Current in cycle: {pomodoroCount === 0 ? 1 : ((pomodoroCount - 1) % settings.longBreakInterval) + 1}
        </DebugInfo>

        {currentSession === 'work' && projectName && (
          <ProjectInfo>
            <ProjectLabel>Project:</ProjectLabel>
            <ProjectName>{projectName}</ProjectName>
          </ProjectInfo>
        )}

        {currentSession === 'work' && taskName && (
          <TaskInfo>
            <TaskLabel>Task:</TaskLabel>
            <TaskName>{taskName}</TaskName>
          </TaskInfo>
        )}

        {/* Show task warning for non-standalone timers when no task is selected or task is from different project */}
        {projectId && currentSession === 'work' && ((!taskName && !taskId) || taskFromDifferentProject) ? (
          <NoTaskWarning>
            <span role="img" aria-label="warning" style={{ marginRight: '10px', fontSize: '1.2rem' }}>⚠️</span>
            {taskFromDifferentProject ?
              "The selected task belongs to a different project" :
              "Please select a task to start the focus timer"}
          </NoTaskWarning>
        ) : null}

        <TimerControls>
          {!isRunning && !isPaused ? (
            <StartButton
              onClick={handleStartTimer}
              disabled={isRunning ||
                (projectId && currentSession === 'work' && ((!taskName && !taskId) || taskFromDifferentProject)) ||
                hasTimerConflict}
            >
              Start
            </StartButton>
          ) : isPaused ? (
            <StartButton
              onClick={handleResumeTimer}
              disabled={isRunning || hasTimerConflict || (projectId && currentSession === 'work' && taskFromDifferentProject)}
            >
              Resume
            </StartButton>
          ) : (
            <PauseButton
              onClick={handlePauseTimer}
              disabled={!isRunning || hasTimerConflict || (projectId && currentSession === 'work' && taskFromDifferentProject)}
            >
              Pause
            </PauseButton>
          )}
          <ResetButton
            onClick={handleResetTimer}
            disabled={hasTimerConflict || (projectId && currentSession === 'work' && taskFromDifferentProject)}
          >
            Reset
          </ResetButton>
          <SkipButton
            onClick={handleSkipSession}
            disabled={hasTimerConflict || (projectId && currentSession === 'work' && taskFromDifferentProject)}
          >
            Skip
          </SkipButton>
        </TimerControls>
      </TimerContainer>

      {/* Project description displayed below the timer card - only show if there's actual content */}
      {projectDescription && projectDescription.trim() !== '' && (
        <ProjectDescriptionContainer>
          <ProjectDescriptionTitle>DESCRIPTION</ProjectDescriptionTitle>
          <ProjectDescriptionText>{projectDescription}</ProjectDescriptionText>
        </ProjectDescriptionContainer>
      )}
    </>
  );
};

// Styled components
const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  position: relative;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  background-color: ${props => props.theme['--card-bg'] || 'white'};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const SessionName = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 20px;
  /* Color matches the session type */
  color: ${props => {
    if (props.session === 'work') return '#d32f2f'; // Darker red for work
    if (props.session === 'shortBreak') return '#1976d2'; // Darker blue for short break
    if (props.session === 'longBreak') return '#388e3c'; // Darker green for long break
    return props.theme['--text-color'] || '#333'; // Default to theme text color
  }};
  text-align: center;
  position: relative;
`;

const PomodoroCount = styled.div`
  font-size: 1rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  margin: 20px 0;
  position: relative;
  padding: 8px 16px;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  border-radius: 50px;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);

    > div {
      display: block;
      animation: fadeInTooltip 0.3s ease-out;
    }
  }

  &::before {
    content: '🍅';
    margin-right: 10px;
    font-size: 1.2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  @keyframes fadeInTooltip {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const PomodoroCountTooltip = styled.div`
  display: none;
  position: absolute;
  background-color: ${props => props.theme['--card-bg'] || '#333'};
  color: ${props => props.theme['--text-color'] || 'white'};
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  margin-bottom: 12px;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  line-height: 1.4;
  font-weight: 500;

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: ${props => props.theme['--card-bg'] || '#333'} transparent transparent transparent;
  }

  /* Add tomato icon */
  &::before {
    content: '🍅';
    margin-right: 8px;
    font-size: 1rem;
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  padding: 10px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;

  /* Add subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    z-index: 0;
  }

  /* Add project icon */
  &::after {
    content: '📂';
    margin-right: 10px;
    font-size: 1.1rem;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const ProjectLabel = styled.span`
  font-weight: 600;
  margin-right: 10px;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  position: relative;
  z-index: 1;
`;

const ProjectName = styled.span`
  color: ${props => props.theme['--text-color'] || '#333'};
  font-weight: 500;
  position: relative;
  z-index: 1;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TaskInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  padding: 10px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;

  /* Add subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    z-index: 0;
  }

  /* Add task icon */
  &::after {
    content: '✓';
    margin-right: 10px;
    font-size: 1.1rem;
    font-weight: bold;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const TaskLabel = styled.span`
  font-weight: 600;
  margin-right: 10px;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  position: relative;
  z-index: 1;
`;

const TaskName = styled.span`
  color: ${props => props.theme['--text-color'] || '#333'};
  font-weight: 500;
  position: relative;
  z-index: 1;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoTaskWarning = styled.div`
  background-color: rgba(244, 67, 54, 0.08);
  border: 1px solid rgba(244, 67, 54, 0.15);
  color: #d32f2f;
  padding: 14px 20px;
  margin-bottom: 24px;
  border-radius: 16px;
  font-size: 1rem;
  width: 100%;
  max-width: 340px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(244, 67, 54, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  /* Add subtle pulsing effect */
  animation: pulse-warning 3s infinite;

  @keyframes pulse-warning {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  /* Add gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    z-index: 0;
  }

  /* Style the warning icon */
  span {
    position: relative;
    z-index: 1;
    font-size: 1.3rem !important;
    margin-right: 12px !important;
    filter: drop-shadow(0 2px 4px rgba(244, 67, 54, 0.2));
  }
`;

const ProjectDescriptionContainer = styled.div`
  margin-top: 24px;
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  margin-bottom: 30px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const ProjectDescriptionTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: #555;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  position: relative;
  display: inline-block;

  /* Add underline effect */
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 3px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
`;

const ProjectDescriptionText = styled.div`
  font-size: 1.05rem;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  padding-top: 6px;
`;

// ProjectMismatchWarning component removed as it's no longer used

const DebugInfo = styled.div`
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-size: 0.8rem;
  margin-bottom: 16px;
  padding: 6px 12px;
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  border-radius: 8px;
  text-align: center;
  opacity: 0.8;
  display: none; /* Hide in production */
`;

const TimerDisplay = styled.div`
  position: relative;
  display: inline-flex;
  margin-bottom: 24px;
  z-index: 1;
`;

const TimerCircle = styled.div`
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  /* Different background colors based on session type */
  background: ${props => {
    if (props.session === 'work') return 'rgba(255, 245, 245, 1)'; // Light red for work
    if (props.session === 'shortBreak') return 'rgba(240, 248, 255, 1)'; // Light blue for short break
    if (props.session === 'longBreak') return 'rgba(240, 255, 240, 1)'; // Light green for long break
    return props.theme['--card-bg'] || 'white'; // Default to theme card background
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.5s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);

  /* Add subtle scale effect when running */
  transform: ${props => props.isRunning && !props.isPaused ? 'scale(1.02)' : 'scale(1)'};

  /* Paused state styling */
  ${props => props.isPaused && `
    opacity: 0.85;
    filter: grayscale(20%);
  `}

  /* Progress ring with thicker, more visible design */
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    width: calc(100% + 16px);
    height: calc(100% + 16px);
    border-radius: 50%;
    background: conic-gradient(
      ${props => {
        if (props.session === 'work') return 'rgba(244, 67, 54, 0.9)'; // Red for work
        if (props.session === 'shortBreak') return 'rgba(33, 150, 243, 0.9)'; // Blue for short break
        if (props.session === 'longBreak') return 'rgba(76, 175, 80, 0.9)'; // Green for long break
        return 'rgba(244, 67, 54, 0.9)'; // Default to red
      }}
      ${props => (100 - props.progress)}%,
      rgba(224, 224, 224, 0.2) ${props => (100 - props.progress)}%
    );
    /* Thicker progress ring */
    mask: radial-gradient(transparent 65%, black 68%);
    -webkit-mask: radial-gradient(transparent 65%, black 68%);
    transition: background 0.5s ease;
    z-index: 0;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }

  /* Enhanced outer glow effect */
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: ${props => {
      if (props.session === 'work') return 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.05) 100%)';
      if (props.session === 'shortBreak') return 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.05) 100%)';
      if (props.session === 'longBreak') return 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.05) 100%)';
      return 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.05) 100%)';
    }};
    z-index: -1;
    filter: blur(8px);
    opacity: ${props => props.isRunning ? 1 : 0.7};
    transition: opacity 0.5s ease;
  }
`;

const TimerTime = styled.div`
  font-size: 3.6rem;
  font-weight: 700;
  color: ${props => props.theme['--text-color'] || '#333'};
  margin-bottom: 10px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  /* Add subtle pulse animation when timer is running */
  animation: ${props => props.isRunning ? 'subtle-pulse 2s infinite' : 'none'};

  @keyframes subtle-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
`;

const SessionEmoji = styled.div`
  font-size: 2.8rem;
  margin-top: 10px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
  animation: float 3s ease-in-out infinite;
  transition: all 0.3s ease;

  /* Different animations based on session type */
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
`;

// TimerOverlayWarning component removed as it's no longer used

const TimerControls = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;
  width: 100%;
  max-width: 340px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  /* Add subtle ripple effect */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  &:active:not(:disabled)::after {
    animation: ripple 0.6s ease-out;
  }

  @keyframes ripple {
    0% {
      transform: scale(0, 0);
      opacity: 0.5;
    }
    100% {
      transform: scale(30, 30);
      opacity: 0;
    }
  }
`;

const StartButton = styled(Button)`
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
  border: none;
  flex: 1.5;
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #2e7d32, #1b5e20);
    border-radius: 50px;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
    transform: translateY(-3px);

    &::before {
      opacity: 1;
    }
  }
`;

const PauseButton = styled(Button)`
  background: linear-gradient(135deg, #f44336, #c62828);
  color: white;
  border: none;
  flex: 1.5;
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #c62828, #b71c1c);
    border-radius: 50px;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
    transform: translateY(-3px);

    &::before {
      opacity: 1;
    }
  }
`;

const ResetButton = styled(Button)`
  background: ${props => props.theme['--card-bg'] || 'white'};
  color: ${props => props.theme['--text-color'] || '#333'};
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex: 1;

  &:hover:not(:disabled) {
    background: ${props => props.theme['--nav-hover-bg'] || '#f5f5f5'};
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
`;

const SkipButton = styled(Button)`
  background: ${props => props.theme['--card-bg'] || 'white'};
  color: ${props => props.theme['--text-color'] || '#333'};
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex: 1;

  &:hover:not(:disabled) {
    background: ${props => props.theme['--nav-hover-bg'] || '#f5f5f5'};
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
`;

// Compact timer styles for header
const CompactTimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  position: relative;
  background-color: ${props => props.theme['--nav-hover-bg'] || 'rgba(217, 85, 80, 0.05)'};
  border-radius: 20px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme['--nav-active-bg'] || 'rgba(217, 85, 80, 0.08)'};
  }
`;

const CompactTimerDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CompactTimerTime = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme['--text-color'] || '#333'};
  font-variant-numeric: tabular-nums;
`;

const CompactSessionEmoji = styled.div`
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
`;

// Warning icon is now used inline with span elements

const RefreshWarning = styled.div`
  position: absolute;
  top: -70px;
  left: 0;
  right: 0;
  background: linear-gradient(to right, #ff9800, #ff7043);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
  animation: slideDown 0.4s ease-out;
  z-index: 100;
  max-width: 90%;
  margin: 0 auto;

  @keyframes slideDown {
    from {
      transform: translateY(-30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

// PermanentWarning component removed as it's no longer used

// Warning text is now used inline with span elements

const TimerConflictOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 100;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);

  /* Add subtle pulsing border */
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    animation: pulse-border 2s infinite;
    z-index: -1;
  }

  @keyframes pulse-border {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.6; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const ConflictWarningText = styled.div`
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 24px;
  line-height: 1.5;
  max-width: 85%;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);

  /* Add warning icon */
  &::before {
    content: '⚠️';
    display: block;
    font-size: 2.2rem;
    margin-bottom: 12px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

const ConflictButtonsContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
  margin-top: 8px;
`;

const StopTimerButton = styled.button`
  background: linear-gradient(135deg, #f44336, #c62828);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.5);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  /* Add ripple effect */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }

  &:active::after {
    animation: ripple 0.6s ease-out;
  }

  &:hover {
    background: linear-gradient(135deg, #d32f2f, #b71c1c);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(244, 67, 54, 0.6);
  }

  &:active {
    transform: translateY(1px);
  }

  @keyframes ripple {
    0% {
      transform: scale(0, 0);
      opacity: 0.5;
    }
    100% {
      transform: scale(30, 30);
      opacity: 0;
    }
  }
`;

const ViewTimerButton = styled.button`
  background: linear-gradient(135deg, #2196f3, #1565c0);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.5);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  /* Add ripple effect */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }

  &:active::after {
    animation: ripple 0.6s ease-out;
  }

  &:hover {
    background: linear-gradient(135deg, #1976d2, #0d47a1);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.6);
  }

  &:active {
    transform: translateY(1px);
  }
`;

export default SimpleTimerFinal;
