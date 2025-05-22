import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { isAuthenticated } from '../services/authService';
import { taskApi } from '../services/apiService';
import { FaCalendarAlt, FaCheck, FaTrash, FaArrowRight, FaMagic } from 'react-icons/fa';
import {
  TaskListContainer, HeaderContainer, AIProjectLink, AddTaskForm, FormRow, TaskInput, PomodoroInput, DateInput,
  AddButton, TaskSection, TaskSectionHeader, FilterContainer, FilterLink, TaskCount, TaskItems,
  TaskItem, TaskContent, TaskTitle, TaskDetails, TaskProgress, DueDate, TaskActions,
  ActionButton, EmptyMessage, LoadingMessage, ErrorMessage
} from './FastTaskList.styles';

const FastTaskList = forwardRef(({ onTaskCompleted, onActiveTaskChange, activeTaskId: externalActiveTaskId }, ref) => {
  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Function to refresh tasks - used when a pomodoro is completed
  const refreshTasks = async () => {
    try {
      console.log('Refreshing tasks, activeTaskId:', localActiveTaskId);

      if (isAuthenticated()) {
        // For now, let's just fetch all tasks to ensure we get the updated data
        const fetchedTasks = await taskApi.getFastTasks();
        console.log('Fetched all tasks:', fetchedTasks);

        // If we have an active task, make sure it's updated with the latest data
        if (localActiveTaskId) {
          console.log('Looking for active task with ID:', localActiveTaskId);
          const activeTask = fetchedTasks.find(task =>
            getTaskId(task) === localActiveTaskId
          );

          if (activeTask) {
            console.log('Found active task:', activeTask);
            console.log('Completed pomodoros:', activeTask.completedPomodoros);
          } else {
            console.warn('Active task not found in fetched tasks');
          }
        }

        setTasks(fetchedTasks);
      } else {
        // Load from localStorage if not authenticated
        const savedTasks = localStorage.getItem('pomodoroFastTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        setTasks(parsedTasks);
      }
      setError(null);
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError('Failed to refresh tasks. Please try again.');
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    refreshTasks
  }));

  // State for active task - use external state if provided
  const [localActiveTaskId, setLocalActiveTaskId] = useState(() => {
    // If external ID is provided, use that, otherwise check localStorage
    if (externalActiveTaskId) {
      return externalActiveTaskId;
    }

    // Use different localStorage keys based on authentication status
    if (isAuthenticated()) {
      const savedActiveTaskId = localStorage.getItem('pomodoroSelectedTodoId_auth');
      return savedActiveTaskId || null;
    } else {
      const savedActiveTaskId = localStorage.getItem('pomodoroSelectedTodoId');
      return savedActiveTaskId || null;
    }
  });

  // Use external active task ID if provided, otherwise use local state
  const activeTaskId = externalActiveTaskId !== undefined ? externalActiveTaskId : localActiveTaskId;

  // Sync with external active task ID when it changes
  useEffect(() => {
    if (externalActiveTaskId !== undefined) {
      setLocalActiveTaskId(externalActiveTaskId);
    }
  }, [externalActiveTaskId]);

  // State to prevent multiple confirmation dialogs
  const [isConfirming, setIsConfirming] = useState(false);

  // Function to set active task that updates both local state and notifies parent
  const setActiveTaskId = (taskId) => {
    // Prevent multiple confirmations
    if (isConfirming) {
      console.log('FastTaskList: Already confirming, ignoring duplicate call');
      return;
    }

    // If the task is already active, do nothing
    if (taskId === localActiveTaskId) {
      console.log('FastTaskList: Task already active, doing nothing');
      return;
    }

    // Check if a timer is running by using the global timerState
    const timerIsRunning = window.globalTimerState && (window.globalTimerState.isRunning || window.globalTimerState.isPaused);

    // If we're clearing the active task
    if (!taskId) {
      // If timer is running, show confirmation dialog
      if (timerIsRunning) {
        console.log('FastTaskList: Timer is running, showing confirmation dialog for deactivating task');

        // Set confirming flag to prevent multiple dialogs
        setIsConfirming(true);

        try {
          const confirmed = window.confirm("Clearing the active task will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

          if (!confirmed) {
            console.log('FastTaskList: User cancelled deactivating task');
            setIsConfirming(false);
            return;
          }

          // User confirmed, proceed with clearing the active task
          console.log('FastTaskList: User confirmed deactivating task, proceeding');

          // Store the current task ID before clearing
          const previousTaskId = localActiveTaskId;

          // Reset the timer by dispatching an event
          console.log('FastTaskList: Dispatching activeTaskChanged event to reset timer');
          window.dispatchEvent(new CustomEvent('activeTaskChanged', {
            detail: {
              taskId: null,
              projectId: null,
              taskName: 'the active task',
              projectName: 'Quick Tasks'
            }
          }));

          // Also try to reset the timer directly if the global function is available
          if (window.updateGlobalTimerState && typeof window.updateGlobalTimerState === 'function') {
            // Get the work session duration
            let workDuration = 25 * 60; // Default to 25 minutes

            // Reset the timer state
            window.updateGlobalTimerState({
              isRunning: false,
              isPaused: false,
              timeRemaining: workDuration,
              currentSession: 'work',
              lastUpdatedTime: Date.now()
            });

            console.log('FastTaskList: Reset timer using global timer state update function');
          }

          // If we had a previous task, refresh the task list to update the pomodoro count
          if (previousTaskId) {
            setTimeout(async () => {
              try {
                console.log('FastTaskList: Refreshing tasks after clearing active task');
                await refreshTasks();
              } catch (err) {
                console.error('Error refreshing tasks after clearing active task:', err);
              }
            }, 500); // Small delay to ensure any pomodoro completion is processed first
          }
        } finally {
          // Always reset the confirming flag
          setIsConfirming(false);
        }
      }

      setLocalActiveTaskId(null);
      if (onActiveTaskChange) {
        onActiveTaskChange(null);
      }
      // Clear task title in localStorage
      localStorage.removeItem('pomodoroSelectedTodoTitle');
      return;
    }

    // If we're switching to a different task and a timer is running
    if (taskId !== localActiveTaskId && timerIsRunning) {
      console.log('FastTaskList: Timer is running, showing confirmation dialog for switching task');

      // Set confirming flag to prevent multiple dialogs
      setIsConfirming(true);

      try {
        // Find the task to get its description for the confirmation message
        const task = tasks.find(t => getTaskId(t) === taskId);
        const taskDescription = task ? task.description : 'this task';

        const confirmed = window.confirm(`Switching to "${taskDescription}" will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?`);

        if (!confirmed) {
          console.log('FastTaskList: User cancelled task switch');
          setIsConfirming(false);
          return;
        }

        // User confirmed, proceed with switching the task
        console.log('FastTaskList: User confirmed task switch, proceeding');

        // Reset the timer by dispatching an event
        console.log('FastTaskList: Dispatching activeTaskChanged event to reset timer');

        // Store the current task ID before switching
        const previousTaskId = localActiveTaskId;

        // Dispatch the event to reset the timer
        window.dispatchEvent(new CustomEvent('activeTaskChanged', {
          detail: {
            taskId: taskId,
            projectId: null, // Fast tasks don't have a project
            taskName: taskDescription,
            projectName: 'Quick Tasks'
          }
        }));

        // Also try to reset the timer directly if the global function is available
        if (window.updateGlobalTimerState && typeof window.updateGlobalTimerState === 'function') {
          // Get the work session duration
          let workDuration = 25 * 60; // Default to 25 minutes
          if (window.globalTimerState && window.globalTimerState.currentSession) {
            // Try to get the current session type
            const currentSession = window.globalTimerState.currentSession;
            // Reset to work session
            workDuration = 25 * 60; // Default to 25 minutes
          }

          // Reset the timer state
          window.updateGlobalTimerState({
            isRunning: false,
            isPaused: false,
            timeRemaining: workDuration,
            currentSession: 'work',
            lastUpdatedTime: Date.now()
          });

          console.log('FastTaskList: Reset timer using global timer state update function');
        }

        // If we had a previous task, refresh the task list to update the pomodoro count
        if (previousTaskId) {
          setTimeout(async () => {
            try {
              console.log('FastTaskList: Refreshing tasks after task switch');
              await refreshTasks();
            } catch (err) {
              console.error('Error refreshing tasks after task switch:', err);
            }
          }, 500); // Small delay to ensure any pomodoro completion is processed first
        }
      } finally {
        // Always reset the confirming flag
        setIsConfirming(false);
      }
    }

    // Update local state
    setLocalActiveTaskId(taskId);

    // Find the task data to pass to the parent component
    const task = tasks.find(t => getTaskId(t) === taskId);
    if (task && onActiveTaskChange) {
      console.log('setActiveTaskId: Passing task data to parent:', task);

      // Save task title to localStorage based on authentication status
      if (task.description) {
        if (isAuthenticated()) {
          localStorage.setItem('pomodoroSelectedTodoTitle_auth', task.description);
          // Clear non-auth key to prevent conflicts
          localStorage.removeItem('pomodoroSelectedTodoTitle');
        } else {
          localStorage.setItem('pomodoroSelectedTodoTitle', task.description);
          // Clear auth key to prevent conflicts
          localStorage.removeItem('pomodoroSelectedTodoTitle_auth');
        }
      }

      onActiveTaskChange(taskId, task);
    } else if (onActiveTaskChange) {
      onActiveTaskChange(taskId);
    }
  };

  // New task form state
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Load tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        let fetchedTasks = [];
        if (isAuthenticated()) {
          // Fetch fast tasks from API if authenticated
          fetchedTasks = await taskApi.getFastTasks();
          setTasks(fetchedTasks);
        } else {
          // Load from localStorage if not authenticated
          const savedTasks = localStorage.getItem('pomodoroFastTasks');
          fetchedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          setTasks(fetchedTasks);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching fast tasks:', err);
        setError('Failed to load tasks. Please try again.');
        // Fallback to localStorage if API fails
        const savedTasks = localStorage.getItem('pomodoroFastTasks');
        setTasks(savedTasks ? JSON.parse(savedTasks) : []);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []); // Only run on mount

  // Verify that the selected task still exists when tasks change
  useEffect(() => {
    if (tasks.length > 0 && localActiveTaskId) {
      const taskExists = tasks.some(task =>
        (isAuthenticated() ? task._id === localActiveTaskId : task.id === localActiveTaskId) && !task.completed
      );

      if (!taskExists) {
        // Task doesn't exist or is completed, clear the selection
        setLocalActiveTaskId(null);
        localStorage.removeItem('pomodoroSelectedTodoId');
        localStorage.removeItem('pomodoroSelectedTodoTitle');

        if (onActiveTaskChange) {
          onActiveTaskChange(null);
        }
      }
    }
  }, [tasks, localActiveTaskId, onActiveTaskChange]);

  // Save tasks to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated() && tasks.length > 0) {
      localStorage.setItem('pomodoroFastTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save active task ID to localStorage
  useEffect(() => {
    if (isAuthenticated()) {
      // Use user-specific keys for authenticated users
      if (localActiveTaskId) {
        localStorage.setItem('pomodoroSelectedTodoId_auth', localActiveTaskId);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoId_auth');
      }

      // Clear non-auth key to prevent conflicts
      localStorage.removeItem('pomodoroSelectedTodoId');
    } else {
      // Use regular keys for non-authenticated users
      if (localActiveTaskId) {
        localStorage.setItem('pomodoroSelectedTodoId', localActiveTaskId);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoId');
      }

      // Clear auth key to prevent conflicts
      localStorage.removeItem('pomodoroSelectedTodoId_auth');
    }
  }, [localActiveTaskId]);

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault();

    if (newTaskDescription.trim()) {
      try {
        if (isAuthenticated()) {
          // Create fast task via API if authenticated
          const taskData = {
            description: newTaskDescription.trim(),
            estimatedPomodoros: newTaskPomodoros,
            dueDate: newTaskDueDate || null
          };
          const newTask = await taskApi.createFastTask(taskData);
          setTasks(prevTasks => [...prevTasks, newTask]);
        } else {
          // Create task locally if not authenticated
          const newTask = {
            id: Date.now().toString(),
            description: newTaskDescription.trim(),
            completed: false,
            estimatedPomodoros: newTaskPomodoros,
            completedPomodoros: 0,
            dueDate: newTaskDueDate || null,
            createdAt: new Date().toISOString(),
          };
          setTasks(prevTasks => [...prevTasks, newTask]);
        }

        // Reset form
        setNewTaskDescription('');
        setNewTaskPomodoros(1);
        setNewTaskDueDate('');
      } catch (err) {
        console.error('Error creating task:', err);
        setError('Failed to create task. Please try again.');
      }
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        // Delete fast task via API if authenticated
        await taskApi.deleteFastTask(taskId);
      }

      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(task =>
        isAuthenticated() ? task._id !== taskId : task.id !== taskId
      ));

      // If the deleted task was active, clear the active task
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Mark a task as completed
  const completeTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        // Update fast task via API if authenticated
        await taskApi.updateFastTask(taskId, { completed: true });
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          (isAuthenticated() ? task._id === taskId : task.id === taskId)
            ? { ...task, completed: true }
            : task
        )
      );

      // If the completed task was active, clear the active task
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }

      // Notify parent component about task completion
      onTaskCompleted && onTaskCompleted(taskId);
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task. Please try again.');
    }
  };

  // Get task ID based on authentication status
  const getTaskId = (task) => {
    if (!task) return null;
    const taskId = isAuthenticated() ? task._id : task.id;
    return taskId;
  };

  // Filter tasks based on due date
  const filterTasksByDueDate = (tasks, filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 7);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);

    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return tasks.filter(task => {
      if (!task.dueDate) {
        // Tasks without due date are shown in ALL filter only
        return filter === 'ALL';
      }

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'TODAY':
          return dueDate.getTime() === today.getTime();
        case 'THIS_WEEK':
          return dueDate >= today && dueDate < nextWeekStart;
        case 'NEXT_WEEK':
          return dueDate >= nextWeekStart && dueDate < nextWeekEnd;
        case 'THIS_MONTH':
          return dueDate >= today && dueDate <= thisMonthEnd;
        case 'ALL':
        default:
          return true;
      }
    });
  };

  // Filter tasks into active and completed
  const allActiveTasks = tasks.filter(task => !task.completed);
  const filteredActiveTasks = filterTasksByDueDate(allActiveTasks, activeFilter);
  const completedTasks = tasks.filter(task => task.completed);

  // Calculate task counts for each filter
  const getTaskCountByFilter = (filter) => {
    return filterTasksByDueDate(allActiveTasks, filter).length;
  };

  const allTasksCount = allActiveTasks.length;
  const todayTasksCount = getTaskCountByFilter('TODAY');
  const thisWeekTasksCount = getTaskCountByFilter('THIS_WEEK');
  const nextWeekTasksCount = getTaskCountByFilter('NEXT_WEEK');
  const thisMonthTasksCount = getTaskCountByFilter('THIS_MONTH');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingMessage>Loading tasks...</LoadingMessage>;
  }

  return (
    <TaskListContainer>
      <HeaderContainer>
        <h2>Quick Tasks</h2>
        <AIProjectLink
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Store the tab to navigate to in localStorage
            localStorage.setItem('navigateToAITab', 'true');
            // Navigate to /app
            window.location.href = '/app';
          }}
        >
          <FaMagic /> Want to use Pomodoro in a project? Our AI helps you <FaArrowRight />
        </AIProjectLink>
      </HeaderContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Add task form */}
      <AddTaskForm onSubmit={addTask}>
        <TaskInput
          type="text"
          placeholder="What are you working on?"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
        />

        <FormRow>
          <PomodoroInput>
            <label>
              Est. Pomodoros:
              <input
                type="number"
                min="1"
                max="10"
                value={newTaskPomodoros}
                onChange={(e) => setNewTaskPomodoros(parseInt(e.target.value) || 1)}
              />
            </label>
          </PomodoroInput>

          <DateInput>
            <label>
              <FaCalendarAlt /> Due Date (Optional):
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
            </label>
          </DateInput>
        </FormRow>

        <AddButton type="submit">
          Add Task
        </AddButton>
      </AddTaskForm>

      {/* Active tasks */}
      <TaskSection>
        <TaskSectionHeader>
          <h3>Active Tasks</h3>
          <FilterContainer>
            <FilterLink
              isActive={activeFilter === 'ALL'}
              onClick={() => setActiveFilter('ALL')}
            >
              All
              <TaskCount isActive={activeFilter === 'ALL'}>{allTasksCount}</TaskCount>
            </FilterLink>
            <FilterLink
              isActive={activeFilter === 'TODAY'}
              onClick={() => setActiveFilter('TODAY')}
            >
              Today
              <TaskCount isActive={activeFilter === 'TODAY'}>{todayTasksCount}</TaskCount>
            </FilterLink>
            <FilterLink
              isActive={activeFilter === 'THIS_WEEK'}
              onClick={() => setActiveFilter('THIS_WEEK')}
            >
              This Week
              <TaskCount isActive={activeFilter === 'THIS_WEEK'}>{thisWeekTasksCount}</TaskCount>
            </FilterLink>
            <FilterLink
              isActive={activeFilter === 'NEXT_WEEK'}
              onClick={() => setActiveFilter('NEXT_WEEK')}
            >
              Next Week
              <TaskCount isActive={activeFilter === 'NEXT_WEEK'}>{nextWeekTasksCount}</TaskCount>
            </FilterLink>
            <FilterLink
              isActive={activeFilter === 'THIS_MONTH'}
              onClick={() => setActiveFilter('THIS_MONTH')}
            >
              This Month
              <TaskCount isActive={activeFilter === 'THIS_MONTH'}>{thisMonthTasksCount}</TaskCount>
            </FilterLink>
          </FilterContainer>
        </TaskSectionHeader>

        {filteredActiveTasks.length === 0 ? (
          <EmptyMessage>
            {allActiveTasks.length === 0
              ? "No active tasks. Add a task to get started!"
              : `No tasks due ${activeFilter === 'TODAY' ? 'today' :
                 activeFilter === 'THIS_WEEK' ? 'this week' :
                 activeFilter === 'NEXT_WEEK' ? 'next week' :
                 activeFilter === 'THIS_MONTH' ? 'this month' : ''}.`}
          </EmptyMessage>
        ) : (
          <TaskItems>
            {filteredActiveTasks.map(task => (
              <TaskItem
                key={getTaskId(task)}
                isActive={getTaskId(task) === activeTaskId}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling

                  // Toggle active task - if this task is already active, clear it
                  if (getTaskId(task) === activeTaskId) {
                    setActiveTaskId(null);
                  } else {
                    // Switch to this task
                    setActiveTaskId(getTaskId(task));
                  }
                }}
              >
                <TaskContent>
                  <TaskTitle isActive={getTaskId(task) === activeTaskId}>
                    {task.description}
                  </TaskTitle>
                  <TaskDetails>
                    <TaskProgress isActive={getTaskId(task) === activeTaskId}>
                      {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                    </TaskProgress>
                    {task.dueDate && (
                      <DueDate isActive={getTaskId(task) === activeTaskId}>
                        <FaCalendarAlt /> {formatDate(task.dueDate)}
                      </DueDate>
                    )}
                  </TaskDetails>
                </TaskContent>

                <TaskActions onClick={(e) => e.stopPropagation()}>
                  <ActionButton
                    onClick={() => completeTask(getTaskId(task))}
                    title="Mark as completed"
                    isActive={getTaskId(task) === activeTaskId}
                  >
                    <FaCheck />
                  </ActionButton>

                  <ActionButton
                    onClick={() => deleteTask(getTaskId(task))}
                    title="Delete task"
                    isActive={getTaskId(task) === activeTaskId}
                  >
                    <FaTrash />
                  </ActionButton>
                </TaskActions>
              </TaskItem>
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
                isCompleted
              >
                <TaskContent>
                  <TaskTitle>{task.description}</TaskTitle>
                  <TaskDetails>
                    <TaskProgress>
                      {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                    </TaskProgress>
                    {task.dueDate && (
                      <DueDate>
                        <FaCalendarAlt /> {formatDate(task.dueDate)}
                      </DueDate>
                    )}
                  </TaskDetails>
                </TaskContent>

                <TaskActions>
                  <ActionButton
                    onClick={() => deleteTask(getTaskId(task))}
                    title="Delete task"
                  >
                    <FaTrash />
                  </ActionButton>
                </TaskActions>
              </TaskItem>
            ))}
          </TaskItems>
        </TaskSection>
      )}
    </TaskListContainer>
  );
});

export default FastTaskList;