import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { isAuthenticated } from '../services/authService';
import { taskApi, milestoneApi } from '../services/apiService';
import promptText from '../promptText';
import { FaRegCircle, FaCircle, FaCalendarAlt } from 'react-icons/fa';
import { TomatoSVG, PomodoroIconWrapper } from './PomodoroIcon';

const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const TaskListContainer = styled.div`
  width: 100%;
  max-width: none;
  font-family: 'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif;
  background: transparent;
  height: auto;
  padding: 0;
  text-align: left;
`;

const CardArea = styled.div`
  width: 100%;
  max-width: none;
  margin: 0;
  height: auto;
  overflow: visible;
`;

const TaskList = ({
  tasks,
  projectId,
  onTaskCompleted,
  onActiveTaskChange,
  activeTaskId,
  onTasksUpdate,
  onMilestonesUpdate
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newSubtasks, setNewSubtasks] = useState([]);
  const latestSubtasksRef = useRef(newSubtasks);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSubtasks, setAiSubtasks] = useState(null);
  const [aiSubtaskCandidates, setAiSubtaskCandidates] = useState([]);
  const [useReasoningModel, setUseReasoningModel] = useState(false);
  const [showReasoningWarning, setShowReasoningWarning] = useState(false);

  // State for task editing
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPomodoros, setEditPomodoros] = useState(1);
  const [editDueDate, setEditDueDate] = useState('');
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [editSubtaskInput, setEditSubtaskInput] = useState('');

  // Flag to prevent multiple confirmations
  const [isConfirming, setIsConfirming] = useState(false);

  // Ref for scrolling to active task
  const activeTaskRef = useRef(null);
  const prevActiveTaskId = useRef();

  // Scroll to the active task when it changes
  useEffect(() => {
    if (activeTaskRef.current && prevActiveTaskId.current !== activeTaskId) {
      activeTaskRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      prevActiveTaskId.current = activeTaskId;
    }
  }, [activeTaskId]);

  // Get task ID based on authentication status
  const getTaskId = (task) => isAuthenticated() ? task._id : task.id;

  // Helper function to synchronize milestones
  const synchronizeMilestonesHelper = () => {
    console.log('TaskList: Calling synchronizeMilestonesHelper');
    console.log('TaskList: window.synchronizeMilestones exists?', !!window.synchronizeMilestones);
    console.log('TaskList: window.refreshMilestones exists?', !!window.refreshMilestones);

    // Dispatch a custom event to notify components about task changes
    // This will trigger the milestone timeline to update
    window.dispatchEvent(new CustomEvent('tasksChanged', {
      detail: { projectId }
    }));

    // For authenticated users, we'll use the global synchronizeMilestones function
    // which handles API calls properly
    if (isAuthenticated()) {
      console.log('TaskList: Authenticated user - using global synchronizeMilestones function');

      if (window.synchronizeMilestones && typeof window.synchronizeMilestones === 'function') {
        console.log('TaskList: Calling global synchronizeMilestones function for authenticated user');
        window.synchronizeMilestones();

        // Add a delayed call to ensure the UI updates
        setTimeout(() => {
          console.log('TaskList: Calling delayed synchronizeMilestones function for authenticated user');
          window.synchronizeMilestones();
        }, 500);
      } else {
        console.error('TaskList: Global synchronizeMilestones function not available for authenticated user');
      }

      return;
    }

    // For non-authenticated users, we'll use direct localStorage manipulation
    console.log('TaskList: Non-authenticated user - using direct localStorage manipulation');

    try {
      // Get all tasks with due dates for this project
      const savedTasks = localStorage.getItem('pomodoroTasks');
      const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
      const projectTasks = parsedTasks.filter(task => task.projectId === projectId);
      const tasksWithDueDates = projectTasks.filter(task => task.dueDate);

      console.log('TaskList: Tasks with due dates:', tasksWithDueDates);

      // Get all existing milestones
      const savedMilestones = localStorage.getItem('pomodoroMilestones');
      const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];

      // Filter out task due milestones for this project
      const allNonTaskMilestones = parsedMilestones.filter(
        milestone => !milestone.title.startsWith('Task Due:') || milestone.projectId !== projectId
      );

      // Create new task due milestones
      const taskDueMilestones = tasksWithDueDates.map(task => ({
        id: `milestone-task-${task.id}-${Date.now()}`,
        title: `Task Due: ${task.title}`,
        dueDate: new Date(task.dueDate).toISOString(),
        completed: task.completed || false,
        projectId: projectId,
        position: 0,
        createdAt: new Date().toISOString()
      }));

      console.log('TaskList: Non-task milestones to keep:', allNonTaskMilestones);
      console.log('TaskList: Task due milestones to create:', taskDueMilestones);

      // Combine non-task milestones with new task due milestones
      const updatedMilestones = [...allNonTaskMilestones, ...taskDueMilestones];

      // Save to localStorage
      localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));

      // Update state with project milestones
      const projectMilestones = updatedMilestones.filter(milestone => milestone.projectId === projectId);
      console.log('TaskList: Updated project milestones:', projectMilestones);

      // Notify parent component about milestone changes
      if (onMilestonesUpdate) {
        onMilestonesUpdate(projectMilestones);
      }

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('milestonesUpdated', {
        detail: { projectId, milestones: projectMilestones }
      }));

      // Force a refresh of the UI
      setTimeout(() => {
        if (onMilestonesUpdate) {
          console.log('TaskList: Forcing UI update with refreshed milestones');
          onMilestonesUpdate([...projectMilestones]);
        }
      }, 100);

      // BACKUP APPROACH: Try to use the global functions as well
      if (window.synchronizeMilestones && typeof window.synchronizeMilestones === 'function') {
        console.log('TaskList: Calling global synchronizeMilestones function as backup');
        window.synchronizeMilestones();
      } else if (window.refreshMilestones && typeof window.refreshMilestones === 'function') {
        console.log('TaskList: Calling global refreshMilestones function as backup');
        window.refreshMilestones();
      }
    } catch (error) {
      console.error('TaskList: Error in direct synchronization approach:', error);

      // If direct approach fails, try the global functions
      if (window.synchronizeMilestones && typeof window.synchronizeMilestones === 'function') {
        console.log('TaskList: Calling global synchronizeMilestones function after error');
        window.synchronizeMilestones();
      } else if (window.refreshMilestones && typeof window.refreshMilestones === 'function') {
        console.log('TaskList: Calling global refreshMilestones function after error');
        window.refreshMilestones();
      }
    }
  };

  // Helper function to check if two dates are the same day
  const areSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Add a new subtask to the new task form
  const addSubtask = (e) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      setNewSubtasks([...newSubtasks, { id: Date.now().toString(), title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput('');
    }
  };
  // Remove a subtask from the new task form
  const removeSubtask = (id) => {
    setNewSubtasks(newSubtasks.filter(st => st.id !== id));
  };
  // Toggle subtask completion in the new task form
  const toggleSubtask = (id) => {
    setNewSubtasks(newSubtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      try {
        const subtasksToAdd = latestSubtasksRef.current;
        console.log('Adding task with subtasks:', subtasksToAdd); // Debug log
        // Calculate estimatedPomodoros: sum of subtasks if present, else use newTaskPomodoros
        let totalEstimatedPomodoros = newTaskPomodoros;
        if (subtasksToAdd && subtasksToAdd.length > 0) {
          totalEstimatedPomodoros = subtasksToAdd.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0);
        }
        if (isAuthenticated()) {
          // Create task via API if authenticated
          const taskData = {
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            estimatedPomodoros: totalEstimatedPomodoros,
            dueDate: newTaskDueDate || null,
            subtasks: subtasksToAdd
          };

          console.log('Submitting task with subtasks:', subtasksToAdd);

          // Check if this is a standalone task or a project task
          if (projectId === null) {
            // This is a standalone task
            console.log('Creating standalone task');
            await taskApi.createStandaloneTask(taskData);
            // Refresh standalone tasks
            const updatedTasks = await taskApi.getStandaloneTasks();
            onTasksUpdate && onTasksUpdate(updatedTasks);
          } else {
            // This is a project task
            console.log('Creating project task');
            taskData.projectId = projectId;
            await taskApi.createTask(taskData);
            // Refresh tasks for this project
            const updatedTasks = await taskApi.getTasks(null, projectId);
            onTasksUpdate && onTasksUpdate(updatedTasks);

            // Synchronize milestones for authenticated users
            console.log('TaskList: Calling synchronizeMilestonesHelper from addTask (authenticated)');
            synchronizeMilestonesHelper();
          }
        } else {
          // Create task locally if not authenticated
          const newTask = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            completed: false,
            estimatedPomodoros: totalEstimatedPomodoros,
            projectId,
            dueDate: newTaskDueDate || null,
            createdAt: new Date().toISOString(),
            subtasks: subtasksToAdd
          };
          // Update localStorage
          const savedTasks = localStorage.getItem('pomodoroTasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          const updatedTasks = [...parsedTasks, newTask];
          localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

          // If task has a due date, create a milestone for it
          if (newTaskDueDate) {
            // Check if a milestone already exists for this date
            const savedMilestones = localStorage.getItem('pomodoroMilestones');
            const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];

            // Check if there's already a milestone for this date in this project
            const existingMilestone = parsedMilestones.find(m =>
              m.projectId === projectId && areSameDate(m.dueDate, newTaskDueDate)
            );

            if (!existingMilestone) {
              // Create a new milestone
              const newMilestone = {
                id: `milestone-${Date.now().toString()}`,
                title: `Task Due: ${newTaskTitle.trim()}`,
                dueDate: new Date(newTaskDueDate).toISOString(),
                completed: false,
                projectId,
                position: parsedMilestones.filter(m => m.projectId === projectId).length,
                createdAt: new Date().toISOString()
              };

              const updatedMilestones = [...parsedMilestones, newMilestone];
              localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));
              console.log(`Created milestone for task due date: ${newTaskDueDate}`);

              // Notify parent component about milestone changes
              if (onMilestonesUpdate) {
                const projectMilestones = updatedMilestones.filter(m => m.projectId === projectId);
                console.log('TaskList: Updating milestones after adding task', projectMilestones);
                onMilestonesUpdate(projectMilestones);

                // Dispatch a custom event to notify other components
                window.dispatchEvent(new CustomEvent('milestonesUpdated', {
                  detail: { projectId, milestones: projectMilestones }
                }));
              }
            }
          }

          // Update parent with new tasks
          onTasksUpdate && onTasksUpdate(updatedTasks.filter(task => task.projectId === projectId));

          // Synchronize milestones
          console.log('TaskList: Calling synchronizeMilestonesHelper from addTask');
          synchronizeMilestonesHelper();
        }
        // Reset form
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPomodoros(1);
        setNewTaskDueDate('');
        setNewSubtasks([]);
        setSubtaskInput('');
        setError(null);
      } catch (err) {
        console.error('Error creating task:', err);
        setError('Failed to create task. Please try again.');
      }
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    // Ask for confirmation before deleting
    const confirmed = window.confirm("Are you sure you want to delete this task? This action cannot be undone.");
    if (!confirmed) {
      return; // User cancelled the deletion
    }

    try {
      let updatedTasks;
      let taskToDelete;

      // FIRST: Log the current state of milestones for debugging
      console.log("MILESTONE DEBUG: Before task deletion");
      const beforeMilestones = localStorage.getItem('pomodoroMilestones');
      const beforeParsedMilestones = beforeMilestones ? JSON.parse(beforeMilestones) : [];
      console.log("All milestones in localStorage:", beforeParsedMilestones);
      console.log("Project ID for filtering:", projectId);
      const beforeProjectMilestones = beforeParsedMilestones.filter(m => m.projectId === projectId);
      console.log("Project milestones before deletion:", beforeProjectMilestones);

      if (isAuthenticated()) {
        // First get the task to check if it has a due date
        try {
          if (projectId === null) {
            // This is a standalone task
            console.log("Deleting standalone task:", taskId);
            await taskApi.deleteStandaloneTask(taskId);
            // Refresh standalone tasks
            updatedTasks = await taskApi.getStandaloneTasks();
          } else {
            // This is a project task
            const taskData = await taskApi.getTasks(taskId);
            taskToDelete = taskData;
            console.log("Task to delete (API):", taskToDelete);

            // Delete task via API if authenticated
            await taskApi.deleteTask(taskId);

            // Refresh tasks
            updatedTasks = await taskApi.getTasks(null, projectId);
          }

          onTasksUpdate && onTasksUpdate(updatedTasks);
        } catch (error) {
          console.error('Error deleting task:', error);
          throw error;
        }

        // Synchronize milestones for authenticated users
        console.log('TaskList: Calling synchronizeMilestonesHelper from deleteTask (authenticated)');
        synchronizeMilestonesHelper();
      } else {
        // Get the task before deleting it to check if it has a due date
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        taskToDelete = parsedTasks.find(task => task.id === taskId);
        console.log("Task to delete (localStorage):", taskToDelete);

        // Delete task from localStorage
        updatedTasks = parsedTasks.filter(task => task.id !== taskId);
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
        onTasksUpdate && onTasksUpdate(updatedTasks.filter(task => task.projectId === projectId));
      }

      // If the deleted task was active, clear the active task
      if (activeTaskId === taskId) {
        onActiveTaskChange(null);
      }

      // SYNCHRONIZE MILESTONES: Use the parent's synchronizeMilestones function
      if (window.synchronizeMilestones && typeof window.synchronizeMilestones === 'function') {
        console.log('TaskList: Calling global synchronizeMilestones function');
        window.synchronizeMilestones();
      } else {
        console.log('TaskList: Global synchronizeMilestones function not available, falling back to refreshMilestones');

        // Fall back to refreshMilestones if synchronizeMilestones is not available
        if (window.refreshMilestones && typeof window.refreshMilestones === 'function') {
          console.log('TaskList: Calling global refreshMilestones function');
          window.refreshMilestones();
        } else {
          console.log('TaskList: Global refreshMilestones function not available');
        }
      }

      // FINAL VERIFICATION: Check if milestones were actually updated
      console.log("MILESTONE DEBUG: After task deletion");
      const afterMilestones = localStorage.getItem('pomodoroMilestones');
      const afterParsedMilestones = afterMilestones ? JSON.parse(afterMilestones) : [];
      console.log("All milestones in localStorage after deletion:", afterParsedMilestones);
      const afterProjectMilestones = afterParsedMilestones.filter(m => m.projectId === projectId);
      console.log("Project milestones after deletion:", afterProjectMilestones);

      // FORCE UPDATE: Directly update the DOM by forcing a re-render
      setTimeout(() => {
        if (window.synchronizeMilestones && typeof window.synchronizeMilestones === 'function') {
          console.log('TaskList: Calling delayed synchronizeMilestones function');
          window.synchronizeMilestones();
        } else if (window.refreshMilestones && typeof window.refreshMilestones === 'function') {
          console.log('TaskList: Calling delayed refreshMilestones function');
          window.refreshMilestones();
        }
      }, 500);

      console.log(`Task ${taskId} deleted successfully`);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Set the active task
  const setActiveTask = (taskId) => {
    // Prevent multiple confirmations
    if (isConfirming) {
      console.log('TaskList: Already confirming, ignoring duplicate call');
      return;
    }

    // Check if a timer is running by using the global timerState
    const timerIsRunning = window.globalTimerState && (window.globalTimerState.isRunning || window.globalTimerState.isPaused);

    // If we're toggling off the active task
    if (taskId === activeTaskId) {
      console.log('TaskList: Deactivating task');

      // If timer is running, show confirmation dialog
      if (timerIsRunning) {
        console.log('TaskList: Timer is running, showing confirmation dialog for deactivating task');

        // Set confirming flag to prevent multiple dialogs
        setIsConfirming(true);

        try {
          const confirmed = window.confirm("Clearing the active task will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

          if (!confirmed) {
            console.log('TaskList: User cancelled deactivating task');
            setIsConfirming(false);
            return;
          }

          // User confirmed, proceed with clearing the active task
          console.log('TaskList: User confirmed deactivating task, proceeding');

          // Reset the timer state if it's running
          if (window.globalTimerState) {
            try {
              // Get the current session time from settings
              const currentSession = window.globalTimerState.currentSession;
              const settings = window.globalSettings || { workTime: 25, shortBreakTime: 5, longBreakTime: 15 };

              // Calculate the new time remaining based on the current session
              const newTimeRemaining = currentSession === 'work'
                ? settings.workTime * 60
                : currentSession === 'shortBreak'
                  ? settings.shortBreakTime * 60
                  : settings.longBreakTime * 60;

              // Reset the timer by setting isRunning and isPaused to false
              const resetTimerState = {
                ...window.globalTimerState,
                isRunning: false,
                isPaused: false,
                timeRemaining: newTimeRemaining,
                lastUpdatedTime: Date.now()
              };

              // Update the global timer state
              window.globalTimerState = resetTimerState;

              // If there's a global function to update the timer state, call it
              if (window.updateGlobalTimerState && typeof window.updateGlobalTimerState === 'function') {
                window.updateGlobalTimerState(resetTimerState);
              }

              console.log('TaskList: Reset timer state when deactivating active task');
            } catch (e) {
              console.error('Error resetting timer state:', e);
            }
          }

          // Clear the active task
          onActiveTaskChange(null);
        } finally {
          // Always reset the confirming flag
          setIsConfirming(false);
        }
      } else {
        // No timer running, just clear the active task
        onActiveTaskChange(null);
      }
      return;
    }

    // Switching to a different task
    if (timerIsRunning) {
      console.log('TaskList: Timer is running, showing confirmation dialog for switching task');

      // Set confirming flag to prevent multiple dialogs
      setIsConfirming(true);

      try {
        const confirmed = window.confirm("Switching active tasks will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

        if (!confirmed) {
          console.log('TaskList: User cancelled task switch');
          setIsConfirming(false);
          return;
        }

        // If confirmed, proceed with changing the active task
        confirmActiveTaskChange(taskId);
      } finally {
        // Always reset the confirming flag
        setIsConfirming(false);
      }
      return;
    }

    // If no timer is running, proceed with changing the active task
    confirmActiveTaskChange(taskId);
  };

  // Function to confirm active task change after dialog
  const confirmActiveTaskChange = (taskId) => {
    // Find the task data to pass to the parent component
    const task = tasks.find(t =>
      (isAuthenticated() ? t._id === taskId : t.id === taskId)
    );

    // Reset the timer state if it's running
    // Use the global timer state instead of localStorage
    if (window.globalTimerState && (window.globalTimerState.isRunning || window.globalTimerState.isPaused)) {
      try {
        // Get the current session time from settings
        const currentSession = window.globalTimerState.currentSession;
        const settings = window.globalSettings || { workTime: 25, shortBreakTime: 5, longBreakTime: 15 };

        // Calculate the new time remaining based on the current session
        const newTimeRemaining = currentSession === 'work'
          ? settings.workTime * 60
          : currentSession === 'shortBreak'
            ? settings.shortBreakTime * 60
            : settings.longBreakTime * 60;

        // Reset the timer by setting isRunning and isPaused to false
        const resetTimerState = {
          ...window.globalTimerState,
          isRunning: false,
          isPaused: false,
          timeRemaining: newTimeRemaining,
          lastUpdatedTime: Date.now()
        };

        // Update the global timer state
        window.globalTimerState = resetTimerState;

        // If there's a global function to update the timer state, call it
        if (window.updateGlobalTimerState && typeof window.updateGlobalTimerState === 'function') {
          window.updateGlobalTimerState(resetTimerState);
        }

        console.log('TaskList: Reset timer state when switching active task');
      } catch (e) {
        console.error('Error resetting timer state:', e);
      }
    }

    if (task) {
      console.log('TaskList: Setting active task with data:', task);
      // Pass both the ID and the task data to the parent
      onActiveTaskChange(taskId, task);
    } else {
      // Fallback if task not found
      console.log('TaskList: Task not found for ID:', taskId);
      onActiveTaskChange(taskId);
    }
  };

  // Mark a task as completed
  const completeTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        if (projectId === null) {
          // This is a standalone task
          console.log("Completing standalone task:", taskId);
          await taskApi.updateStandaloneTask(taskId, { completed: true });
          // Refresh standalone tasks
          const updatedTasks = await taskApi.getStandaloneTasks();
          // Update the tasks in the parent component
          onTasksUpdate && onTasksUpdate(updatedTasks);
        } else {
          // This is a project task
          // Update task via API if authenticated
          await taskApi.updateTask(taskId, { completed: true });
          // Refresh tasks
          const updatedTasks = await taskApi.getTasks(null, projectId);
          // Update the tasks in the parent component
          onTasksUpdate && onTasksUpdate(updatedTasks);
        }
      } else {
        // Update localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const updatedTasks = parsedTasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        );
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

        // Update the tasks in the parent component
        onTasksUpdate && onTasksUpdate(updatedTasks.filter(task => task.projectId === projectId));
      }

      // If the completed task was active, clear the active task
      if (activeTaskId === taskId) {
        onActiveTaskChange(null);
      }

      // Notify parent component about task completion
      onTaskCompleted && onTaskCompleted(taskId);

      // Synchronize milestones
      synchronizeMilestonesHelper();

      console.log(`Task ${taskId} marked as completed`);
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task. Please try again.');
    }
  };

  // Reactivate a completed task
  const reactivateTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        if (projectId === null) {
          // This is a standalone task
          console.log("Reactivating standalone task:", taskId);
          await taskApi.updateStandaloneTask(taskId, { completed: false });
          // Refresh standalone tasks
          const updatedTasks = await taskApi.getStandaloneTasks();
          // Update the tasks in the parent component
          onTasksUpdate && onTasksUpdate(updatedTasks);
        } else {
          // This is a project task
          // Update task via API if authenticated
          await taskApi.updateTask(taskId, { completed: false });
          // Refresh tasks
          const updatedTasks = await taskApi.getTasks(null, projectId);
          // Update the tasks in the parent component
          onTasksUpdate && onTasksUpdate(updatedTasks);
        }
      } else {
        // Update localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const updatedTasks = parsedTasks.map(task =>
          task.id === taskId ? { ...task, completed: false } : task
        );
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

        // Update the tasks in the parent component
        onTasksUpdate && onTasksUpdate(updatedTasks.filter(task => task.projectId === projectId));
      }

      // Synchronize milestones
      synchronizeMilestonesHelper();

      console.log(`Task ${taskId} reactivated successfully`);
    } catch (err) {
      console.error('Error reactivating task:', err);
      setError('Failed to reactivate task. Please try again.');
    }
  };

  // Filter tasks into active and completed
  let activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Move the active task to the top of the activeTasks list
  if (activeTaskId) {
    activeTasks = [
      ...activeTasks.filter(task => (task.id === activeTaskId || task._id === activeTaskId)),
      ...activeTasks.filter(task => (task.id !== activeTaskId && task._id !== activeTaskId))
    ];
  }

  // 渲染任务的番茄钟图标 - 只显示已完成的番茄钟
  // Only show completed pomodoros in red
  const renderTaskPomodoros = (task) => {
    // Get actual completed pomodoros
    const completed = Number(task.completedPomodoros) || 0;

    const icons = [];
    // Only show completed pomodoros
    for (let i = 0; i < completed; i++) {
      icons.push(<PomodoroIcon key={i}><TomatoSVG size={18} color="#d95550" /></PomodoroIcon>);
    }

    return (
      <PomodoroCountWrapper>
        {icons}
      </PomodoroCountWrapper>
    );
  };

  // Sub-task completion and deletion for existing tasks
  const handleSubtaskToggle = (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
    updateTaskSubtasks(task, updatedSubtasks);
  };
  const handleSubtaskDelete = (task, subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    updateTaskSubtasks(task, updatedSubtasks);
  };
  const updateTaskSubtasks = async (task, updatedSubtasks) => {
    try {
      if (isAuthenticated()) {
        if (projectId === null) {
          // This is a standalone task
          console.log("Updating subtasks for standalone task:", getTaskId(task));
          await taskApi.updateStandaloneTask(getTaskId(task), { subtasks: updatedSubtasks });
          // Refresh standalone tasks
          const updatedTasks = await taskApi.getStandaloneTasks();
          onTasksUpdate && onTasksUpdate(updatedTasks);
        } else {
          // This is a project task
          await taskApi.updateTask(getTaskId(task), { subtasks: updatedSubtasks });
          const updatedTasks = await taskApi.getTasks(null, projectId);
          onTasksUpdate && onTasksUpdate(updatedTasks);
        }
      } else {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const updatedTasks = parsedTasks.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t);
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
        onTasksUpdate && onTasksUpdate(updatedTasks.filter(t => t.projectId === projectId));
      }
    } catch (err) {
      setError('Failed to update sub-tasks.');
    }
  };

  // Start editing a task
  const startEditing = (task) => {
    setEditingTaskId(getTaskId(task));
    setEditTitle(task.title);
    setEditPomodoros(task.estimatedPomodoros || 1);

    // Format due date for date input (YYYY-MM-DD)
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const formattedDate = date.toISOString().split('T')[0];
      setEditDueDate(formattedDate);
    } else {
      setEditDueDate('');
    }

    // Clone subtasks to avoid direct state mutation
    setEditSubtasks(task.subtasks ? [...task.subtasks] : []);
    setEditSubtaskInput('');
  };

  // Save task edits
  const saveTaskEdit = async () => {
    if (editTitle.trim()) {
      try {
        if (isAuthenticated()) {
          // Calculate total pomodoros - from subtasks if they exist, otherwise use the editPomodoros value
          const totalPomodoros = editSubtasks.length > 0
            ? editSubtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0) || 1
            : editPomodoros;

          const taskData = {
            title: editTitle.trim(),
            estimatedPomodoros: totalPomodoros,
            dueDate: editDueDate || null,
            subtasks: editSubtasks // Use the edited subtasks
          };

          if (projectId === null) {
            // This is a standalone task
            console.log("Updating standalone task:", editingTaskId);
            await taskApi.updateStandaloneTask(editingTaskId, taskData);
            // Refresh standalone tasks
            const updatedTasks = await taskApi.getStandaloneTasks();
            onTasksUpdate && onTasksUpdate(updatedTasks);
          } else {
            // This is a project task
            // Update task via API if authenticated
            await taskApi.updateTask(editingTaskId, taskData);
            // Refresh tasks
            const updatedTasks = await taskApi.getTasks(null, projectId);
            onTasksUpdate && onTasksUpdate(updatedTasks);

            // Synchronize milestones for authenticated users
            console.log('TaskList: Calling synchronizeMilestonesHelper from saveTaskEdit (authenticated)');
            synchronizeMilestonesHelper();
          }
        } else {
          // Update localStorage
          const savedTasks = localStorage.getItem('pomodoroTasks');
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          // Calculate total pomodoros - from subtasks if they exist, otherwise use the editPomodoros value
          const totalPomodoros = editSubtasks.length > 0
            ? editSubtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0) || 1
            : editPomodoros;

          // Find the task being edited to get its old due date
          const oldTask = parsedTasks.find(task => task.id === editingTaskId);
          const oldDueDate = oldTask?.dueDate;

          // Update the task
          const updatedTasks = parsedTasks.map(task =>
            task.id === editingTaskId ? {
              ...task,
              title: editTitle.trim(),
              estimatedPomodoros: totalPomodoros,
              dueDate: editDueDate || null,
              subtasks: editSubtasks // Use the edited subtasks
            } : task
          );
          localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

          // Handle milestone creation/update if due date has changed
          if (editDueDate !== oldDueDate) {
            const savedMilestones = localStorage.getItem('pomodoroMilestones');
            const parsedMilestones = savedMilestones ? JSON.parse(savedMilestones) : [];
            let updatedMilestones = [...parsedMilestones];
            let milestonesChanged = false;

            // If there was an old due date, find and remove the old milestone
            if (oldDueDate) {
              const oldMilestone = parsedMilestones.find(m =>
                m.projectId === projectId &&
                m.title === `Task Due: ${oldTask.title}` &&
                areSameDate(m.dueDate, oldDueDate)
              );

              if (oldMilestone) {
                updatedMilestones = updatedMilestones.filter(m => m.id !== oldMilestone.id);
                milestonesChanged = true;
              }
            }

            // If there's a new due date, create a milestone if one doesn't exist
            if (editDueDate) {
              const existingMilestone = updatedMilestones.find(m =>
                m.projectId === projectId && areSameDate(m.dueDate, editDueDate)
              );

              if (!existingMilestone) {
                // Create a new milestone
                const newMilestone = {
                  id: `milestone-${Date.now().toString()}`,
                  title: `Task Due: ${editTitle.trim()}`,
                  dueDate: new Date(editDueDate).toISOString(),
                  completed: false,
                  projectId,
                  position: updatedMilestones.filter(m => m.projectId === projectId).length,
                  createdAt: new Date().toISOString()
                };

                updatedMilestones.push(newMilestone);
                milestonesChanged = true;
                console.log(`Created milestone for updated task due date: ${editDueDate}`);
              }
            }

            // Save updated milestones if changes were made
            if (milestonesChanged) {
              localStorage.setItem('pomodoroMilestones', JSON.stringify(updatedMilestones));

              // Notify parent component about milestone changes
              if (onMilestonesUpdate) {
                const projectMilestones = updatedMilestones.filter(m => m.projectId === projectId);
                console.log('TaskList: Updating milestones after editing task', projectMilestones);
                onMilestonesUpdate(projectMilestones);

                // Dispatch a custom event to notify other components
                window.dispatchEvent(new CustomEvent('milestonesUpdated', {
                  detail: { projectId, milestones: projectMilestones }
                }));
              }
            }
          }

          onTasksUpdate && onTasksUpdate(updatedTasks.filter(task => task.projectId === projectId));

          // Synchronize milestones
          synchronizeMilestonesHelper();
        }

        // Exit edit mode
        setEditingTaskId(null);
      } catch (err) {
        console.error('Error updating task:', err);
        setError('Failed to update task. Please try again.');
      }
    }
  };

  // State for new subtask pomodoro count
  const [newSubtaskPomodoros, setNewSubtaskPomodoros] = useState(1);

  // Add a subtask in edit mode
  const addEditSubtask = () => {
    if (editSubtaskInput.trim()) {
      setEditSubtasks([
        ...editSubtasks,
        {
          id: Date.now().toString(),
          title: editSubtaskInput.trim(),
          completed: false,
          estimatedPomodoros: newSubtaskPomodoros
        }
      ]);
      setEditSubtaskInput('');
      // Reset pomodoro count to 1 for next subtask
      setNewSubtaskPomodoros(1);
    }
  };

  // Remove a subtask in edit mode
  const removeEditSubtask = (subtaskId) => {
    setEditSubtasks(editSubtasks.filter(st => st.id !== subtaskId));
  };

  // Toggle subtask completion in edit mode
  const toggleEditSubtask = (subtaskId) => {
    setEditSubtasks(editSubtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  // Update subtask properties in edit mode
  const updateEditSubtask = (subtaskId, field, value) => {
    setEditSubtasks(editSubtasks.map(st =>
      st.id === subtaskId ? { ...st, [field]: value } : st
    ));
  };

  // Cancel task editing
  const cancelEditing = () => {
    setEditingTaskId(null);
  };

  function handleAIGenerate() {
    if (useReasoningModel) {
      setShowReasoningWarning(true);
      return;
    }
    // Use Promise chain instead of async/await
    Promise.resolve().then(() => runAIGeneration('deepseek-chat'));
  }

  function runAIGeneration(model) {
    setAiLoading(true);
    setAiError(null);
    setAiSubtasks(null);
    setAiSubtaskCandidates([]);

    const userPrompt = newTaskTitle.trim();
    if (!userPrompt) {
      setAiError('Please enter a task description first.');
      setAiLoading(false);
      return Promise.resolve(); // Return a resolved promise for chaining
    }

    if (!DEEPSEEK_API_KEY) {
      setAiError('AI service is not configured. Please add your DeepSeek API key to the environment variables (REACT_APP_DEEPSEEK_API_KEY).');
      setAiLoading(false);
      return Promise.resolve();
    }

    // Use Promise chain instead of async/await
    return fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: promptText },
          { role: 'user', content: `"""${userPrompt}"""` },
        ],
        stream: false,
      }),
    })
    .then(response => response.json())
    .then(data => {
      let content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content from AI');

      // Try to parse JSON from the AI response
      let json;
      try {
        json = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON substring if extra text is present
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          json = JSON.parse(match[0]);
        } else {
          throw new Error('AI did not return valid JSON');
        }
      }
      setAiSubtasks(json);
    })
    .catch(err => {
      setAiError('AI generation failed: ' + err.message);
    })
    .finally(() => {
      setAiLoading(false);
    });
  }

  // When AI sub-tasks are received, parse them into editable candidates
  useEffect(() => {
    if (aiSubtasks && aiSubtasks.sub_tasks) {
      setAiSubtaskCandidates(aiSubtasks.sub_tasks.map(st => ({ ...st })));
    }
  }, [aiSubtasks]);

  function handleEditCandidate(idx, field, value) {
    setAiSubtaskCandidates(cands => cands.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }
  function handleDeleteCandidate(idx) {
    setAiSubtaskCandidates(cands => cands.filter((_, i) => i !== idx));
  }
  function handleAddCandidate() {
    setAiSubtaskCandidates(cands => [
      ...cands,
      { task_name: '', task_description: '', estimated_pomodoros: 1 }
    ]);
  }
  // Modified to return a promise that resolves when state is updated
  function handleConfirmAddCandidates() {
    return new Promise(resolve => {
      setNewSubtasks(subs => {
        const updatedSubs = [
          ...subs,
          ...aiSubtaskCandidates.map(st => ({
            id: Date.now().toString() + Math.random(),
            title: st.task_name,
            description: st.task_description,
            completed: false,
            estimatedPomodoros: st.estimated_pomodoros
          }))
        ];

        // Use setTimeout to ensure state is updated before resolving
        setTimeout(() => {
          resolve(updatedSubs);
        }, 0);

        return updatedSubs;
      });

      setAiSubtasks(null);
      setAiSubtaskCandidates([]);
    });
  }

  function handleEditSubtask(idx, field, value) {
    setNewSubtasks(subs => subs.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }
  function handleDeleteSubtask(idx) {
    setNewSubtasks(subs => subs.filter((_, i) => i !== idx));
  }
  function handleAddSubtask() {
    setNewSubtasks(subs => [
      ...subs,
      { id: Date.now().toString() + Math.random(), title: '', description: '', completed: false, estimatedPomodoros: 1 }
    ]);
  }

  useEffect(() => {
    latestSubtasksRef.current = newSubtasks;
  }, [newSubtasks]);

  return (
    <TaskListContainer>
      <CardArea>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {/* Add Task Button (opens modal) */}
        <OpenModalButton onClick={() => setIsModalOpen(true)}>+ Add Task</OpenModalButton>
        {/* Modal for Add Task Form */}
        {isModalOpen && (
          <ModalOverlay>
            <ModalContent>
              <CloseModalButton onClick={() => setIsModalOpen(false)}>×</CloseModalButton>
              <ModalTitle>Add Task</ModalTitle>
              <TaskFormRow>
                <TaskFormLeft>
                  <TaskFormLabel htmlFor="task-desc">Task Description</TaskFormLabel>
                  <TaskFormInput
                    id="task-desc"
                    type="text"
                    placeholder="Describe your task..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    autoFocus
                  />

                  <TaskFormLabel htmlFor="task-due-date">Due Date (Optional)</TaskFormLabel>
                  <TaskFormInput
                    id="task-due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                  />

                  <TaskFormLabel htmlFor="task-pomodoros">Estimated Pomodoros</TaskFormLabel>
                  <PomodoroInputContainer>
                    <PomodoroNumberInput
                      id="task-pomodoros"
                      type="number"
                      min="1"
                      max="100"
                      value={newTaskPomodoros}
                      onChange={e => setNewTaskPomodoros(parseInt(e.target.value) || 1)}
                    />
                    <PomodoroLabel>🍅</PomodoroLabel>
                  </PomodoroInputContainer>
                </TaskFormLeft>
              </TaskFormRow>
              {/* Show AI error or generated subtasks */}
              {aiError && <ErrorMessage>{aiError}</ErrorMessage>}
              {aiSubtasks && (
                <AISubtaskResult>
                  <div><b>Main Task:</b> {aiSubtasks.main_task?.name} - {aiSubtasks.main_task?.description}</div>
                  <div style={{marginTop: '0.5em'}}><b>Sub-tasks (editable):</b></div>
                  <ul style={{padding: 0, listStyle: 'none'}}>
                    {aiSubtaskCandidates.map((st, idx) => (
                      <li key={idx} style={{
                        marginBottom: '0.7em',
                        borderBottom: '1px solid #eee',
                        paddingBottom: '0.5em'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4em' }}>
                          <input
                            type="text"
                            value={st.task_name}
                            onChange={e => handleEditCandidate(idx, 'task_name', e.target.value)}
                            placeholder="Sub-task name"
                            style={{
                              flex: 1,
                              padding: '0.5em',
                              border: '1px solid #ddd',
                              borderRadius: '0.25em',
                              marginRight: '0.5em'
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <input
                              type="number"
                              min={1}
                              value={st.estimated_pomodoros}
                              onChange={e => handleEditCandidate(idx, 'estimated_pomodoros', parseInt(e.target.value)||1)}
                              style={{
                                width: '50px',
                                padding: '0.5em',
                                border: '1px solid #ddd',
                                borderRadius: '0.25em',
                                textAlign: 'center'
                              }}
                            />
                            <span style={{ margin: '0 0.5em' }}>🍅</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCandidate(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d32f2f',
                              cursor: 'pointer',
                              fontSize: '1.1em',
                              padding: '0.2em 0.5em'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={st.task_description}
                          onChange={e => handleEditCandidate(idx, 'task_description', e.target.value)}
                          placeholder="Sub-task description (optional)"
                          style={{
                            width: '100%',
                            padding: '0.5em',
                            border: '1px solid #ddd',
                            borderRadius: '0.25em',
                            resize: 'vertical',
                            minHeight: '2.5em'
                          }}
                          rows={1}
                        />
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1em' }}>
                    <button
                      onClick={handleAddCandidate}
                      style={{
                        background: 'none',
                        border: '1px solid #ddd',
                        borderRadius: '0.25em',
                        padding: '0.5em 1em',
                        color: '#555',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Sub-task
                    </button>
                  </div>
                </AISubtaskResult>
              )}
              {newSubtasks.length > 0 && (
                <AISubtaskResult>
                  <div style={{marginTop: '0.5em'}}><b>Current Sub-tasks (editable):</b></div>
                  <ul style={{padding: 0, listStyle: 'none'}}>
                    {newSubtasks.map((st, idx) => (
                      <li key={st.id} style={{
                        marginBottom: '0.7em',
                        borderBottom: '1px solid #eee',
                        paddingBottom: '0.5em'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4em' }}>
                          <input
                            type="text"
                            value={st.title}
                            onChange={e => handleEditSubtask(idx, 'title', e.target.value)}
                            placeholder="Sub-task name"
                            style={{
                              flex: 1,
                              padding: '0.5em',
                              border: '1px solid #ddd',
                              borderRadius: '0.25em',
                              marginRight: '0.5em'
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <input
                              type="number"
                              min={1}
                              value={st.estimatedPomodoros}
                              onChange={e => handleEditSubtask(idx, 'estimatedPomodoros', parseInt(e.target.value)||1)}
                              style={{
                                width: '50px',
                                padding: '0.5em',
                                border: '1px solid #ddd',
                                borderRadius: '0.25em',
                                textAlign: 'center'
                              }}
                            />
                            <span style={{ margin: '0 0.5em' }}>🍅</span>
                          </div>
                          <button
                            onClick={() => handleDeleteSubtask(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#d32f2f',
                              cursor: 'pointer',
                              fontSize: '1.1em',
                              padding: '0.2em 0.5em'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={st.description || ''}
                          onChange={e => handleEditSubtask(idx, 'description', e.target.value)}
                          placeholder="Sub-task description (optional)"
                          style={{
                            width: '100%',
                            padding: '0.5em',
                            border: '1px solid #ddd',
                            borderRadius: '0.25em',
                            resize: 'vertical',
                            minHeight: '2.5em'
                          }}
                          rows={1}
                        />
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1em' }}>
                    <button
                      onClick={handleAddSubtask}
                      style={{
                        background: 'none',
                        border: '1px solid #ddd',
                        borderRadius: '0.25em',
                        padding: '0.5em 1em',
                        color: '#555',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Sub-task
                    </button>
                  </div>
                </AISubtaskResult>
              )}
              {showReasoningWarning && (
                <WarningOverlay>
                  <WarningBox>
                    <div style={{ marginBottom: 16 }}>
                      <b>Warning:</b> The reasoning model may take significantly longer to respond.<br />
                      Do you want to continue?
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button onClick={() => {
                        setShowReasoningWarning(false);
                        // Use Promise chain instead of async/await
                        Promise.resolve().then(() => runAIGeneration('deepseek-reasoner'));
                      }} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.5em 1.2em', borderRadius: 4 }}>Continue</button>
                      <button onClick={() => setShowReasoningWarning(false)} style={{ background: '#eee', color: '#333', border: 'none', padding: '0.5em 1.2em', borderRadius: 4 }}>Cancel</button>
                    </div>
                  </WarningBox>
                </WarningOverlay>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <AIButton onClick={handleAIGenerate} disabled={aiLoading || !newTaskTitle.trim()}>
                    <AIBadge>AI</AIBadge> {aiLoading ? 'Generating...' : 'Generate Sub-task'}
                  </AIButton>

                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 16 }}>
                    <input
                      type="checkbox"
                      id="reasoning-model"
                      checked={useReasoningModel}
                      onChange={e => setUseReasoningModel(e.target.checked)}
                      disabled={aiLoading}
                      style={{ marginRight: 8 }}
                    />
                    <label htmlFor="reasoning-model" style={{ fontSize: '0.9em', color: '#666' }}>
                      Use reasoning model (slower)
                    </label>
                  </div>
                </div>

                <AddButton
                  type="button"
                  onClick={() => {
                    // Use Promise chain instead of async/await
                    let promise = Promise.resolve();

                    // If there are AI-generated subtasks, add them first
                    if (aiSubtasks && aiSubtaskCandidates.length > 0) {
                      promise = promise
                        .then(() => handleConfirmAddCandidates())
                        .then(() => new Promise(resolve => setTimeout(resolve, 50)));
                    }

                    // Create a synthetic event for addTask
                    const fakeEvent = { preventDefault: () => {} };

                    // Chain the addTask call
                    promise
                      .then(() => addTask(fakeEvent))
                      .then(() => setIsModalOpen(false))
                      .catch(error => {
                        console.error("Error adding task:", error);
                        setError("Failed to add task. Please try again.");
                      });
                  }}
                  disabled={!newTaskTitle.trim()}
                >
                  Add Task
                </AddButton>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
        {/* Ongoing tasks */}
        <TaskSection>
          <h3>Ongoing Tasks</h3>

          {activeTasks.length === 0 ? (
            <EmptyMessage>No ongoing tasks. Add a task to get started!</EmptyMessage>
          ) : (
            <TaskItems>
              {activeTasks.map(task => (
                <AnimatedTaskItem
                  key={getTaskId(task)}
                  $isActive={getTaskId(task) === activeTaskId}
                  $isCompleted={task.completed}
                  ref={getTaskId(task) === activeTaskId ? activeTaskRef : null}
                >
                  {editingTaskId === getTaskId(task) ? (
                    // Edit mode
                    <EditForm>
                      <EditFormLabel>Task Title:</EditFormLabel>
                      <EditFormInput
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />

                      <EditFormLabel>Due Date:</EditFormLabel>
                      <EditFormInput
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />

                      {editSubtasks.length > 0 ? (
                        <EditFormLabel>Estimated Pomodoros: {editSubtasks.reduce((sum, st) => sum + (Number(st.estimatedPomodoros) || 0), 0) || 1}</EditFormLabel>
                      ) : (
                        <>
                          <EditFormLabel>Estimated Pomodoros:</EditFormLabel>
                          <EditFormNumberInput
                            type="number"
                            min="1"
                            max="100"
                            value={editPomodoros}
                            onChange={(e) => setEditPomodoros(parseInt(e.target.value) || 1)}
                          />
                        </>
                      )}

                      {/* Subtasks section */}
                      <EditFormLabel>Subtasks:</EditFormLabel>
                      <SubtaskEditList>
                        {editSubtasks.map((subtask, index) => (
                          <SubtaskEditItem key={subtask.id}>
                            <SubtaskEditCheckbox
                              type="checkbox"
                              checked={!!subtask.completed}
                              onChange={() => toggleEditSubtask(subtask.id)}
                            />
                            <SubtaskEditInputGroup>
                              <SubtaskEditInput
                                type="text"
                                value={subtask.title}
                                onChange={(e) => updateEditSubtask(subtask.id, 'title', e.target.value)}
                                placeholder="Subtask title"
                              />
                              <SubtaskEditNumberInput
                                type="number"
                                min="1"
                                max="5"
                                value={subtask.estimatedPomodoros || 1}
                                onChange={(e) => updateEditSubtask(subtask.id, 'estimatedPomodoros', parseInt(e.target.value) || 1)}
                              />
                              <SubtaskEditLabel>🍅</SubtaskEditLabel>
                            </SubtaskEditInputGroup>
                            <SubtaskEditRemoveButton onClick={() => removeEditSubtask(subtask.id)}>
                              ×
                            </SubtaskEditRemoveButton>
                          </SubtaskEditItem>
                        ))}
                      </SubtaskEditList>

                      {/* Add new subtask */}
                      <SubtaskEditAddForm>
                        <SubtaskEditInput
                          type="text"
                          value={editSubtaskInput}
                          onChange={(e) => setEditSubtaskInput(e.target.value)}
                          placeholder="Add a new subtask"
                          onKeyDown={(e) => e.key === 'Enter' && addEditSubtask()}
                        />
                        <SubtaskEditNumberInput
                          type="number"
                          min="1"
                          max="10"
                          value={newSubtaskPomodoros}
                          onChange={(e) => setNewSubtaskPomodoros(parseInt(e.target.value) || 1)}
                          title="Estimated Pomodoros"
                        />
                        <SubtaskEditLabel>🍅</SubtaskEditLabel>
                        <SubtaskEditAddButton onClick={addEditSubtask}>
                          Add Subtask
                        </SubtaskEditAddButton>
                      </SubtaskEditAddForm>

                      <EditActions>
                        <SaveButton
                          onClick={saveTaskEdit}
                        >
                          Save
                        </SaveButton>
                        <CancelButton
                          onClick={cancelEditing}
                        >
                          Cancel
                        </CancelButton>
                      </EditActions>
                    </EditForm>
                  ) : (
                    // View mode
                    <>
                      <TaskContent>
                        <TaskTitle>{task.title}</TaskTitle>
                        {task.dueDate && (
                          <TaskDueDate>
                            <CalendarIcon /> Due: {new Date(task.dueDate).toLocaleDateString()}
                          </TaskDueDate>
                        )}
                        <div style={{ margin: '0.25rem 0 0.5rem 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Show estimated pomodoros */}
                          {Array.from({ length: task.estimatedPomodoros }).map((_, i) =>
                            i < (task.completedPomodoros || 0) ? (
                              <PomodoroIcon key={i}>
                                <TomatoSVG size={18} color="#d95550" />
                              </PomodoroIcon>
                            ) : (
                              <PomodoroIcon key={i}>
                                <TomatoSVG size={18} color="#bbb" />
                              </PomodoroIcon>
                            )
                          )}
                          {/* If completed pomodoros exceed estimated, show a "+" with the extra count */}
                          {(task.completedPomodoros || 0) > task.estimatedPomodoros && (
                            <span style={{
                              marginLeft: '4px',
                              color: '#e11d48',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              + {(task.completedPomodoros || 0) - task.estimatedPomodoros}
                            </span>
                          )}
                        </div>
                        {task.description && <TaskDescription>{task.description}</TaskDescription>}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <SubtaskList>
                            {task.subtasks.map(st => (
                              <SubtaskItem key={st.id}>
                                <input type="checkbox" checked={!!st.completed} onChange={() => handleSubtaskToggle(task, st.id)} />
                                <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>
                                  <b>{st.title}</b>
                                  {st.description && (
                                    <span style={{ color: '#888', marginLeft: 8 }}> - {st.description}</span>
                                  )}
                                  {typeof st.estimatedPomodoros === 'number' && (
                                    <span style={{ marginLeft: 8 }}>
                                      {Array.from({ length: st.estimatedPomodoros }, (_, i) => (
                                        <PomodoroIcon key={i}>
                                          <TomatoSVG size={16} color="#bbb" />
                                        </PomodoroIcon>
                                      ))}
                                    </span>
                                  )}
                                </span>
                                <RemoveSubtaskButton onClick={() => handleSubtaskDelete(task, st.id)}>×</RemoveSubtaskButton>
                              </SubtaskItem>
                            ))}
                          </SubtaskList>
                        )}
                      </TaskContent>

                      <TaskActions>
                        <ActionButton
                          onClick={() => {
                            console.log('Clicked Set Active button for task:', task);
                            setActiveTask(getTaskId(task));
                          }}
                          $isActive={getTaskId(task) === activeTaskId}
                          $isPrimary={!activeTaskId || getTaskId(task) !== activeTaskId}
                          title="Set as active task"
                          style={{
                            fontWeight: 'bold',
                            backgroundColor: getTaskId(task) === activeTaskId ? '#4caf50' : '#2196f3',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px'
                          }}
                        >
                          {getTaskId(task) === activeTaskId ? '✓ Active' : '▶ Set Active'}
                        </ActionButton>

                        <ActionButton
                          onClick={() => startEditing(task)}
                          title="Edit task"
                        >
                          Edit
                        </ActionButton>

                        <ActionButton
                          onClick={() => completeTask(getTaskId(task))}
                          title="Mark as completed"
                        >
                          Complete
                        </ActionButton>

                        <ActionButton
                          onClick={() => deleteTask(getTaskId(task))}
                          title="Delete task"
                        >
                          Delete
                        </ActionButton>
                      </TaskActions>
                    </>
                  )}
                </AnimatedTaskItem>
              ))}
            </TaskItems>
          )}
        </TaskSection>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <TaskSection>
            <h3>Completed Tasks</h3>

            <TaskItems>
              {completedTasks.map(task => (
                <TaskItem
                  key={getTaskId(task)}
                  $isCompleted
                >
                  <TaskContent>
                    <TaskTitle>{task.title}</TaskTitle>
                    <div style={{ margin: '0.25rem 0 0.5rem 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Show estimated pomodoros (all in red since task is completed) */}
                      {Array.from({ length: task.estimatedPomodoros || 0 }).map((_, i) => (
                        <PomodoroIcon key={i}>
                          <TomatoSVG size={18} color="#d95550" />
                        </PomodoroIcon>
                      ))}
                      {/* If completed pomodoros exceed estimated, show a "+" with the extra count */}
                      {(task.completedPomodoros || 0) > (task.estimatedPomodoros || 0) && (
                        <span style={{
                          marginLeft: '4px',
                          color: '#e11d48',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          + {(task.completedPomodoros || 0) - (task.estimatedPomodoros || 0)}
                        </span>
                      )}
                    </div>
                    {task.description && <TaskDescription>{task.description}</TaskDescription>}
                  </TaskContent>

                  <TaskActions>
                    <ActionButton
                      onClick={() => reactivateTask(getTaskId(task))}
                      title="Move back to ongoing tasks"
                    >
                      Move to Ongoing
                    </ActionButton>

                    <ActionButton
                      onClick={() => deleteTask(getTaskId(task))}
                      title="Delete task"
                    >
                      Delete
                    </ActionButton>
                  </TaskActions>
                </TaskItem>
              ))}
            </TaskItems>
          </TaskSection>
        )}
      </CardArea>

      {/* Removed confirmation dialog in favor of browser confirm */}
    </TaskListContainer>
  );
};

// Styled components
const AddTaskForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TaskInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--text-color);
`;

const PomodoroInput = styled.div`
  display: flex;
  align-items: center;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-color);
  }

  input {
    width: 3rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    text-align: center;
    background-color: var(--card-bg);
    color: var(--text-color);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.2rem;
  background-color: #d9534f;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 120px;

  &:hover {
    background-color: #c9302c;
  }

  &:disabled {
    background-color: #cccccc;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TaskSection = styled.section`
  margin-bottom: 1.5rem;
  h3 {
    margin: 0.75rem 0 0.5rem;
    font-weight: 600;
    color: #333;
    font-size: 1rem;
    letter-spacing: 0.01em;
    border-bottom: 1px solid #ececec;
    padding-bottom: 0.25rem;
  }
`;

const TaskItems = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TaskItem = styled.li`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #ececec;
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem 0.5rem 1rem;
  transition: box-shadow 0.2s;
  position: relative;
  opacity: ${props => props.$isCompleted ? 0.7 : 1};
  border-left: 4px solid ${props =>
    props.$isActive && !props.$isCompleted ? '#4caf50' : '#bbb'};
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  text-align: left;
`;

const TaskContent = styled.div`
  flex: 1;
  margin-bottom: 0.5rem;
  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const TaskTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.15rem;
  color: #222;
  text-align: left;
`;

const TaskDueDate = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const CalendarIcon = styled(FaCalendarAlt)`
  margin-right: 0.4rem;
  color: #5664f4;
  font-size: 0.8rem;
`;

const TaskProgress = styled.div`
  font-size: 0.95rem;
  color: #888;
  margin-bottom: 0.5rem;
  text-align: left;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.35rem;
  background-color: ${props => {
    if (props.$isActive) return '#6366f1';
    if (props.$isPrimary) return '#4c9195';
    return '#f0f0f0';
  }};
  color: ${props => (props.$isActive || props.$isPrimary) ? '#fff' : '#555'};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  box-shadow: ${props => props.$isPrimary ? '0 1px 4px rgba(76,145,149,0.08)' : 'none'};
  &:hover {
    background-color: ${props => props.$isActive ? '#4f46e5' : props.$isPrimary ? '#3a7276' : '#e0e0e0'};
    color: #fff;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #777;
  font-style: italic;
  padding: 1rem;
  background-color: var(--card-bg);
  border-radius: 0.25rem;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 0.25rem;
  font-size: 0.9rem;
`;

const PomodoroCountWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
`;

// Using TomatoSVG from PomodoroIcon.js

const PomodoroIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 0.1rem;
`;

const PomodoroText = styled.span`
  font-size: 0.9rem;
  color: #d95550;
  margin-left: 0.2rem;
`;

const TaskDescription = styled.div`
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
  text-align: left;
`;

const SubtaskSection = styled.div`
  margin-bottom: 0.75rem;
`;

const SubtaskInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const SubtaskInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  background-color: var(--card-bg);
  color: var(--text-color);
`;

const AddSubtaskButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    background-color: #4f46e5;
  }
`;

const SubtaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0.5rem;
  background: #f5f6fa;
  border-radius: 0.5rem;
  text-align: left;
`;

const SubtaskItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.3rem;
  padding: 0.5rem 0.5rem 0.5rem 0.2rem;
  border-radius: 0.4rem;
  background: #f9f9fb;
  text-align: left;
`;

const RemoveSubtaskButton = styled.button`
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 1.1rem;
  cursor: pointer;
  margin-left: 0.5rem;
  &:hover { color: #b91c1c; }
`;

// Custom checkbox
const SubtaskCheckbox = styled.input.attrs({ type: 'checkbox' })`
  accent-color: #6366f1;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 0.2rem;
  margin-right: 0.2rem;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #fff;
  color: #222;
  padding: 2rem 2rem 2rem 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.10);
  min-width: 500px;
  max-width: 95vw;
  width: 550px;
  position: relative;
  border: 1.5px solid #ececec;
`;

const CloseModalButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  &:hover { color: #d32f2f; }
`;

const OpenModalButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.9rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: background 0.2s;
  &:hover { background-color: #4f46e5; }
`;

// Modal and form styles for new layout
const ModalTitle = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
`;

const TaskFormRow = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TaskFormLeft = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TaskFormLabel = styled.label`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const TaskFormInput = styled.input`
  width: 100%;
  font-size: 1rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  height: 45px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
`;

const PomodoroInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const PomodoroNumberInput = styled.input`
  width: 80px;
  font-size: 1rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  text-align: center;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
`;

const PomodoroLabel = styled.span`
  font-size: 1.5rem;
  color: #d95550;
  display: flex;
  align-items: center;
`;

const TaskFormRight = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
  margin-top: 1.2rem;
`;

const AIButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  font-size: 0.95rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  height: 42px;

  &:hover {
    background: #f9f9f9;
    border-color: #ccc;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AIBadge = styled.span`
  background: #a259c6;
  color: #fff;
  font-size: 0.85em;
  font-weight: bold;
  border-radius: 0.2em;
  padding: 0.2em 0.4em;
  margin-right: 0.3em;
`;

const AISubtaskResult = styled.div`
  background: #f6f6fa;
  border: 1px solid #e0e0e0;
  border-radius: 0.3rem;
  margin-top: 1.2rem;
  padding: 1rem;
  color: #333;
  font-size: 1rem;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
`;

// Add warning overlay styles
const WarningOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WarningBox = styled.div`
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  padding: 2rem 2.5rem;
  min-width: 320px;
  max-width: 95vw;
  color: #333;
  font-size: 1.08rem;
`;

// Edit form styled components
const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 0.5rem;
`;

const EditFormLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
`;

const EditFormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const EditFormTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
  resize: vertical;
`;

const EditFormNumberInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  width: 75px;
  text-align: center;
`;

const EditActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-start;
`;

// Subtask edit styled components
const SubtaskEditList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1.5rem 0;
`;

const SubtaskEditItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: white;
  border-radius: 0.25rem;
  border: 1px solid #eee;
`;

const SubtaskEditCheckbox = styled.input`
  accent-color: #6366f1;
  width: 1.2rem;
  height: 1.2rem;
`;

const SubtaskEditInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const SubtaskEditInput = styled.input`
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.95rem;
`;

const SubtaskEditNumberInput = styled.input`
  width: 3rem;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  text-align: center;
`;

const SubtaskEditLabel = styled.span`
  font-size: 1rem;
  color: #d95550;
`;

const SubtaskEditRemoveButton = styled.button`
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: #b91c1c;
  }
`;

const SubtaskEditAddForm = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: center;
`;

const SubtaskEditAddButton = styled.button`
  padding: 0.6rem 1rem;
  background-color: #5664f4;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    background-color: #4f46e5;
  }
`;

const SaveButton = styled.button`
  padding: 0.6rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

const CancelButton = styled.button`
  padding: 0.6rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    background-color: #e0e0e0;
  }
`;

// Slide-in animation for active task
const slideIn = keyframes`
  from {
    transform: translateX(-40px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const AnimatedTaskItem = styled(TaskItem)`
  ${props => props.isActive && css`
    animation: ${slideIn} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 4px 16px rgba(99,102,241,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.04);
    border-left: 6px solid #6366f1;
    background: #f0f4ff;
    z-index: 2;
    position: relative;
  `}
`;

export default TaskList;
