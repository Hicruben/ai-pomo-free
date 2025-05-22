import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import { taskApi, milestoneApi, noteApi, userApi, pomodoroApi } from '../services/apiService';
import SimpleTimerFinal from './SimpleTimerFinal';
import TaskList from './TaskList';
import NotesGrid from './NotesGrid';

const ProjectDetail = ({
  project,
  timerState,
  onTimerStateChange,
  onPomodoroCompleted,
  settings,
  onBack,
  activeTaskId: externalActiveTaskId,
  onActiveTaskChange
}) => {
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [notes, setNotes] = useState([]);
  const [localActiveTaskId, setLocalActiveTaskId] = useState(null);
  // Flag to prevent multiple confirmations
  const [isConfirming, setIsConfirming] = useState(false);
  // State for refresh warning
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  // Use external activeTaskId if provided, otherwise use local state
  const activeTaskId = externalActiveTaskId !== undefined ? externalActiveTaskId : localActiveTaskId;

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Handle beforeunload event to warn users before page refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // If timer is running or paused, show a warning message
      if (timerState && (timerState.isRunning || timerState.isPaused)) {
        // Show a warning message to the user
        const message = "Warning: Refreshing the page will reset your timer. Are you sure you want to continue?";
        event.preventDefault();
        event.returnValue = message; // Standard for most browsers

        console.log(`ProjectDetail: Showing refresh warning - isRunning: ${timerState.isRunning}, isPaused: ${timerState.isPaused}`);

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
  }, [timerState]);

  // Prevent refresh shortcuts (F5, Ctrl+R)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // If timer is running or paused, prevent refresh shortcuts
      if (timerState && (timerState.isRunning || timerState.isPaused)) {
        // F5 key
        if (event.key === 'F5') {
          event.preventDefault();
          console.log('ProjectDetail: Prevented F5 refresh');

          // Show a warning toast or alert
          setShowRefreshWarning(true);
          setTimeout(() => setShowRefreshWarning(false), 3000);
          return false;
        }

        // Ctrl+R or Command+R (refresh)
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
          event.preventDefault();
          console.log('ProjectDetail: Prevented Ctrl+R refresh');

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
  }, [timerState]);

  // Sync local state with external activeTaskId when it changes
  useEffect(() => {
    if (externalActiveTaskId !== undefined) {
      console.log('ProjectDetail: Syncing local activeTaskId with external:', externalActiveTaskId);
      setLocalActiveTaskId(externalActiveTaskId);
    }
  }, [externalActiveTaskId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get project ID based on authentication status
  const getProjectId = () => isAuthenticated() ? project._id : project.id;

  // Load project data on component mount
  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const projectId = getProjectId();

        if (isAuthenticated()) {
          // Fetch data from API if authenticated
          const [fetchedTasks, fetchedMilestones, fetchedNotes] = await Promise.all([
            taskApi.getTasks(null, projectId),
            milestoneApi.getMilestones(projectId),
            noteApi.getNotes(projectId)
          ]);

          setTasks(fetchedTasks);
          setMilestones(fetchedMilestones);
          setNotes(fetchedNotes);
        } else {
          // Load from localStorage if not authenticated
          // Tasks
          const savedTasks = localStorage.getItem('pomodoroTasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          const projectTasks = parsedTasks.filter(task => task.projectId === projectId);
          setTasks(projectTasks);

          // Milestones
          const savedMilestones = localStorage.getItem('pomodoroMilestones');
          const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
          const projectMilestones = parsedMilestones.filter(milestone => milestone.projectId === projectId);
          setMilestones(projectMilestones);

          // Notes
          const savedNotes = localStorage.getItem('pomodoroNotes');
          const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
          const projectNotes = parsedNotes.filter(note => note.projectId === projectId);
          setNotes(projectNotes);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (project) {
      fetchProjectData();
    }
  }, [project]);

  // Handle task completion
  const handleTaskCompleted = async (taskId) => {
    try {
      // If the completed task was active, clear the active task
      if (activeTaskId === taskId) {
        // Clear active task in local state
        setLocalActiveTaskId(null);

        // For authenticated users, clear active task in database
        if (isAuthenticated()) {
          try {
            console.log('ProjectDetail: Clearing active task in database after task completion');
            await userApi.setActiveTask(null);
          } catch (error) {
            console.error('ProjectDetail: Error clearing active task in database:', error);
          }
        }

        // Also notify parent if handler is available
        if (onActiveTaskChange) {
          onActiveTaskChange(null);
        }
      }

      // Refresh tasks
      const projectId = getProjectId();
      if (isAuthenticated()) {
        const updatedTasks = await taskApi.getTasks(null, projectId);
        setTasks(updatedTasks);
      } else {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const projectTasks = parsedTasks.filter(task => task.projectId === projectId);
        setTasks(projectTasks);
      }
    } catch (err) {
      console.error('Error updating tasks:', err);
      setError('Failed to update tasks. Please try again.');
    }
  };

  // Handle active task change
  const handleActiveTaskChange = async (taskId, taskData = null) => {
    console.log('ProjectDetail: handleActiveTaskChange called with taskId:', taskId, 'and taskData:', taskData);

    // Prevent multiple confirmations
    if (isConfirming) {
      console.log('ProjectDetail: Already confirming, ignoring duplicate call');
      return;
    }

    // If we're clearing the active task (taskId is null), proceed without confirmation
    if (!taskId) {
      confirmActiveTaskChange(taskId, taskData);
      return;
    }

    // Check if a timer is running by looking at timerState
    if (timerState && timerState.isRunning && !timerState.isPaused) {
      console.log('ProjectDetail: Timer is running, showing confirmation dialog');

      // Set confirming flag to prevent multiple dialogs
      setIsConfirming(true);

      try {
        // Use browser's built-in confirm dialog
        const confirmed = window.confirm("Switching active tasks will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

        if (!confirmed) {
          console.log('ProjectDetail: User cancelled task switch');
          return;
        }

        // If confirmed, proceed with changing the active task
        confirmActiveTaskChange(taskId, taskData);
      } finally {
        // Always reset the confirming flag
        setIsConfirming(false);
      }
      return;
    }

    // If no timer is running, proceed with changing the active task
    confirmActiveTaskChange(taskId, taskData);
  };

  // Function to confirm active task change after dialog
  const confirmActiveTaskChange = async (taskId, taskData = null) => {
    // Update local state
    setLocalActiveTaskId(taskId);

    // Reset the timer if it's running
    if (timerState && (timerState.isRunning || timerState.isPaused)) {
      // Create a reset timer state
      const resetTimerState = {
        ...timerState,
        isRunning: false,
        isPaused: false,
        timeRemaining: timerState.currentSession === 'work' ? 25 * 60 :
                      timerState.currentSession === 'shortBreak' ? 5 * 60 : 15 * 60,
        lastUpdatedTime: Date.now()
      };

      // Update the timer state
      if (onTimerStateChange) {
        console.log('ProjectDetail: Resetting timer state when switching active task');
        onTimerStateChange(resetTimerState);
      }

      // Also update localStorage for consistency
      localStorage.setItem('pomodoroTimerState', JSON.stringify(resetTimerState));
    }

    // For authenticated users, save to database
    if (isAuthenticated()) {
      try {
        if (taskId) {
          console.log('ProjectDetail: Saving active task to database:', taskId);
          await userApi.setActiveTask(taskId);
        } else {
          console.log('ProjectDetail: Clearing active task in database');
          await userApi.setActiveTask(null);
        }
      } catch (error) {
        console.error('ProjectDetail: Error saving active task to database:', error);
        // Continue with localStorage as fallback
      }
    }

    // For non-authenticated users or as a fallback, save to localStorage
    if (taskId) {
      localStorage.setItem('pomodoroActiveTaskId', taskId);

      // If we have task data, save it to cache
      if (taskData) {
        localStorage.setItem('activeTaskCache', JSON.stringify(taskData));
      } else {
        // Try to find the task in the tasks array
        const task = tasks.find(t =>
          (t._id && t._id === taskId) || (t.id && t.id === taskId)
        );

        if (task) {
          localStorage.setItem('activeTaskCache', JSON.stringify(task));
        }
      }
    } else {
      // Clear active task
      localStorage.removeItem('pomodoroActiveTaskId');
      localStorage.removeItem('activeTaskCache');
    }

    // Pass the task data to the parent component's handler if available
    if (onActiveTaskChange) {
      console.log('ProjectDetail: Calling parent onActiveTaskChange with taskId:', taskId, 'and taskData:', taskData);

      // Create a custom event to indicate this task change is from the project detail page
      // This will be used to prevent navigation to the timer page
      window.fromProjectDetail = true;

      // Call the parent handler
      onActiveTaskChange(taskId, taskData);

      // Clear the flag after a short delay
      setTimeout(() => {
        window.fromProjectDetail = false;
      }, 500);
    } else {
      console.log('ProjectDetail: No parent onActiveTaskChange handler available');
    }
  };

  // Handle pomodoro completion
  const handlePomodoroCompleted = async (data) => {
    try {
      // Extract data from the parameter, supporting both object and boolean formats
      let wasInterrupted = false;
      let isSkip = false;

      if (typeof data === 'object') {
        wasInterrupted = data.wasInterrupted || false;
        isSkip = data.isSkip || false;
      } else {
        // For backward compatibility, treat boolean as wasInterrupted
        wasInterrupted = !!data;
      }

      console.log(`[ProjectDetail] Pomodoro completed. wasInterrupted: ${wasInterrupted}, isSkip: ${isSkip}`);
      console.log(`[ProjectDetail] Active task ID: ${activeTaskId}`);

      // If the timer was skipped, don't create a pomodoro record
      if (isSkip) {
        console.log(`[ProjectDetail] Timer was skipped, not creating pomodoro record`);

        // Still call parent handler to maintain the flow
        if (onPomodoroCompleted) {
          onPomodoroCompleted({wasInterrupted, isSkip});
        }

        return;
      }

      const projectId = getProjectId();
      console.log(`[ProjectDetail] Project ID: ${projectId}`);

      // Update task progress if there's an active task
      if (activeTaskId) {
        if (isAuthenticated()) {
          console.log(`[ProjectDetail] User is authenticated, creating pomodoro record in database`);
          console.log(`[ProjectDetail] Active task ID type: ${typeof activeTaskId}, value: ${activeTaskId}`);

          // Log all tasks to help with debugging
          console.log(`[ProjectDetail] All tasks:`, tasks);

          // Find the active task to ensure we have the correct ID format
          const activeTask = tasks.find(t =>
            (t._id && t._id === activeTaskId) || (t.id && t.id === activeTaskId)
          );

          console.log(`[ProjectDetail] Found active task:`, activeTask);
          console.log(`[ProjectDetail] Active task ID from state: ${activeTaskId}, type: ${typeof activeTaskId}`);

          // Use the _id property if available, otherwise use the id property
          let taskIdToUse;
          if (activeTask) {
            taskIdToUse = activeTask._id || activeTask.id;
          } else {
            taskIdToUse = activeTaskId;
          }

          // Create a pomodoro record
          try {
            const response = await pomodoroApi.createPomodoro({
              taskId: taskIdToUse,
              projectId: projectId,
              startTime: new Date(Date.now() - 25 * 60 * 1000), // Assuming 25 minutes for a pomodoro
              endTime: new Date(),
              duration: 25,
              completed: true,
              interrupted: wasInterrupted
            });

            console.log(`[ProjectDetail] Pomodoro created successfully:`, response);
            console.log(`[ProjectDetail] Pomodoro created for task: ${taskIdToUse}`);

            // Refresh tasks to get updated data
            const updatedTasks = await taskApi.getTasks(null, projectId);
            console.log(`[ProjectDetail] Tasks refreshed. Count: ${updatedTasks.length}`);
            setTasks(updatedTasks);
          } catch (error) {
            console.error(`[ProjectDetail] Error creating pomodoro:`, error);
            console.error(`[ProjectDetail] Error details:`, error.response ? error.response.data : error.message);
          }
        } else {
          // Update localStorage
          const savedTasks = localStorage.getItem('pomodoroTasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

          const updatedTasks = parsedTasks.map(task => {
            if (task.id === activeTaskId) {
              return {
                ...task,
                completedPomodoros: (task.completedPomodoros || 0) + 1,
                completed: task.completed
              };
            }
            return task;
          });

          localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

          // Update local state
          const projectTasks = updatedTasks.filter(task => task.projectId === projectId);
          setTasks(projectTasks);
        }
      }

      // Call parent handler if provided
      if (onPomodoroCompleted) {
        // Pass the full data object to maintain all flags
        if (typeof data === 'object') {
          onPomodoroCompleted(data);
        } else {
          // For backward compatibility
          onPomodoroCompleted({wasInterrupted, isSkip: false});
        }
      }
    } catch (error) {
      console.error('Error updating pomodoro count:', error);
    }
  };

  if (loading) {
    return <LoadingMessage>Loading project data...</LoadingMessage>;
  }

  if (!project) {
    return <ErrorMessage>No project selected. Please select a project to view details.</ErrorMessage>;
  }

  return (
    <ProjectDetailContainer>
      {showRefreshWarning && (
        <RefreshWarning>
          <WarningIcon>⚠️</WarningIcon>
          Refreshing the page will reset your timer!
        </RefreshWarning>
      )}

      <ProjectHeader>
        <HeaderTop>
        </HeaderTop>
      </ProjectHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ProjectContent>
        <TimerSection>
          <SimpleTimerFinal
            initialDuration={25 * 60}
            projectId={getProjectId()}
            taskId={activeTaskId}
            projectName={project.title}
            taskName={tasks.find(task => (task._id || task.id) === activeTaskId)?.title}
            projectDescription={project.description}
            onComplete={handlePomodoroCompleted}
            timerState={timerState}
            onTimerStateChange={onTimerStateChange}
          />
        </TimerSection>
        <TaskSection>
          <SectionTitle>Tasks</SectionTitle>
          <TaskList
            tasks={tasks}
            projectId={getProjectId()}
            onTaskCompleted={handleTaskCompleted}
            onActiveTaskChange={handleActiveTaskChange}
            activeTaskId={activeTaskId}
            onTasksUpdate={setTasks}
          />
        </TaskSection>
        <NotesSection>
          <SectionTitle>Memos</SectionTitle>
          <NotesGrid
            notes={notes}
            projectId={getProjectId()}
            onNotesUpdate={setNotes}
          />
        </NotesSection>
      </ProjectContent>

      {/* Removed confirmation dialog in favor of browser confirm */}
    </ProjectDetailContainer>
  );
};

// Styled components
const ProjectDetailContainer = styled.div`
  width: 100%;
  padding: 1.5rem;
`;

const ProjectHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ProjectTitle = styled.h1`
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 500;
  color: var(--text-color);
`;

const ProjectDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
`;

const ProjectContent = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 1100px) {
    flex-direction: column;
    gap: 1.2rem;
  }
`;

const TimerSection = styled.section`
  flex: 0 0 auto;
  width: 500px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px;

  @media (max-width: 1200px) {
    width: 450px;
  }

  @media (max-width: 1100px) {
    width: 100%;
    max-width: 500px;
    margin: 0 auto 1.5rem auto;
  }
`;

const TaskSection = styled.section`
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1100px) {
    width: 100%;
    margin-bottom: 1.5rem;
  }
`;

const NotesSection = styled.section`
  flex: 0 0 auto;
  width: 300px;
  min-width: 250px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1100px) {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-color);
`;

const RefreshWarning = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff9800;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.3s ease-out;
  z-index: 1000;

  @keyframes slideDown {
    from {
      transform: translate(-50%, -20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const WarningIcon = styled.span`
  margin-right: 8px;
  font-size: 1.2rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-color);
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.9rem;
`;

export default ProjectDetail;
