import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { taskApi } from '../services/apiService';
import { isAuthenticated } from '../services/authService';

const SimpleTaskList = ({ onTaskCompleted, onActiveTaskChange, activeTaskId: externalActiveTaskId }) => {
  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for active task - use external state if provided
  const [localActiveTaskId, setLocalActiveTaskId] = useState(() => {
    const savedActiveTaskId = localStorage.getItem('pomodoroActiveTaskId');
    return savedActiveTaskId || null;
  });

  // Use external active task ID if provided, otherwise use local state
  const activeTaskId = externalActiveTaskId !== undefined ? externalActiveTaskId : localActiveTaskId;

  // Function to set active task that updates both local state and notifies parent
  const setActiveTaskId = (taskId) => {
    setLocalActiveTaskId(taskId);

    // If we're clearing the active task
    if (!taskId) {
      if (onActiveTaskChange) {
        onActiveTaskChange(null);
      }
      return;
    }

    // Find the task data to pass to the parent component
    const task = tasks.find(t => getTaskId(t) === taskId);
    if (task && onActiveTaskChange) {
      console.log('setActiveTaskId: Passing task data to parent:', task);
      onActiveTaskChange(taskId, task);
    } else if (onActiveTaskChange) {
      onActiveTaskChange(taskId);
    }
  };

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);

  // Load tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        if (isAuthenticated()) {
          // Fetch standalone tasks from API if authenticated
          const fetchedTasks = await taskApi.getStandaloneTasks();
          setTasks(fetchedTasks);
        } else {
          // Load from localStorage if not authenticated
          const savedTasks = localStorage.getItem('pomodoroTasks');
          // Filter for standalone tasks (those without a projectId)
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
          const standaloneTasks = parsedTasks.filter(task => !task.projectId);
          setTasks(standaloneTasks);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching standalone tasks:', err);
        setError('Failed to load tasks. Please try again.');
        // Fallback to localStorage if API fails
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const standaloneTasks = parsedTasks.filter(task => !task.projectId);
        setTasks(standaloneTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Save tasks to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated() && tasks.length > 0) {
      localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save active task ID to localStorage
  useEffect(() => {
    if (localActiveTaskId) {
      localStorage.setItem('pomodoroActiveTaskId', localActiveTaskId);
    } else {
      localStorage.removeItem('pomodoroActiveTaskId');
    }
  }, [localActiveTaskId]);

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault();

    if (newTaskTitle.trim()) {
      try {
        if (isAuthenticated()) {
          // Create standalone task via API if authenticated
          const taskData = {
            title: newTaskTitle.trim(),
            estimatedPomodoros: newTaskPomodoros,
          };
          const newTask = await taskApi.createStandaloneTask(taskData);
          setTasks(prevTasks => [...prevTasks, newTask]);
        } else {
          // Create task locally if not authenticated
          const newTask = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            completed: false,
            estimatedPomodoros: newTaskPomodoros,
            completedPomodoros: 0,
            createdAt: new Date().toISOString(),
          };
          setTasks(prevTasks => [...prevTasks, newTask]);
        }

        // Reset form
        setNewTaskTitle('');
        setNewTaskPomodoros(1);
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
        // Delete standalone task via API if authenticated
        await taskApi.deleteStandaloneTask(taskId);
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

  // Set the active task
  const setActiveTask = (taskId) => {
    // If we're toggling off the active task
    if (taskId === activeTaskId) {
      setActiveTaskId(null);
      return;
    }

    // Find the task data to pass to the parent component
    const task = tasks.find(t => getTaskId(t) === taskId);
    if (task) {
      console.log('Setting active task with data:', task);
      // Pass both the ID and the task data to the parent
      if (onActiveTaskChange) {
        onActiveTaskChange(taskId, task);
      } else {
        setLocalActiveTaskId(taskId);
      }
    } else {
      // Fallback if task not found
      setActiveTaskId(taskId);
    }
  };

  // Mark a task as completed
  const completeTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        // Update standalone task via API if authenticated
        await taskApi.updateStandaloneTask(taskId, { completed: true });
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

  // Reactivate a completed task
  const reactivateTask = async (taskId) => {
    try {
      if (isAuthenticated()) {
        // Update standalone task via API if authenticated
        await taskApi.updateStandaloneTask(taskId, { completed: false });
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          (isAuthenticated() ? task._id === taskId : task.id === taskId)
            ? { ...task, completed: false }
            : task
        )
      );
    } catch (err) {
      console.error('Error reactivating task:', err);
      setError('Failed to reactivate task. Please try again.');
    }
  };

  // Get task ID based on authentication status
  const getTaskId = (task) => isAuthenticated() ? task._id : task.id;

  // Filter tasks into active and completed
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  if (loading) {
    return <LoadingMessage>Loading tasks...</LoadingMessage>;
  }

  return (
    <TaskListContainer>
      <h2>Tasks</h2>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Add task form */}
      <AddTaskForm onSubmit={addTask}>
        <TaskInput
          type="text"
          placeholder="What are you working on?"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />

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

        <AddButton type="submit">
          Add Task
        </AddButton>
      </AddTaskForm>

      {/* Active tasks */}
      <TaskSection>
        <h3>Active Tasks</h3>

        {activeTasks.length === 0 ? (
          <EmptyMessage>No active tasks. Add a task to get started!</EmptyMessage>
        ) : (
          <TaskItems>
            {activeTasks.map(task => (
              <TaskItem
                key={getTaskId(task)}
                isActive={getTaskId(task) === activeTaskId}
              >
                <TaskContent>
                  <TaskTitle>{task.title}</TaskTitle>
                  <TaskProgress>
                    {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                    {(task.completedPomodoros || 0) > (task.estimatedPomodoros || 1) && (
                      <span style={{
                        marginLeft: '4px',
                        color: '#e11d48',
                        fontWeight: 'bold'
                      }}>
                        (+{(task.completedPomodoros || 0) - (task.estimatedPomodoros || 1)})
                      </span>
                    )}
                  </TaskProgress>
                </TaskContent>

                <TaskActions>
                  <ActionButton
                    onClick={() => {
                      // Direct approach - pass the full task object
                      const taskId = getTaskId(task);
                      console.log('Clicked Set Active for task:', task);

                      if (taskId === activeTaskId) {
                        // Deactivate
                        if (onActiveTaskChange) {
                          console.log('Deactivating task');
                          onActiveTaskChange(null);
                        }
                      } else {
                        // Activate with full task data
                        if (onActiveTaskChange) {
                          console.log('Activating task with data:', task);
                          onActiveTaskChange(taskId, task);
                        }
                      }
                    }}
                    isActive={getTaskId(task) === activeTaskId}
                    title="Set as active task"
                  >
                    {getTaskId(task) === activeTaskId ? 'Active' : 'Set Active'}
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
                  <TaskTitle>{task.title}</TaskTitle>
                  <TaskProgress>
                    {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                    {(task.completedPomodoros || 0) > (task.estimatedPomodoros || 1) && (
                      <span style={{
                        marginLeft: '4px',
                        color: '#e11d48',
                        fontWeight: 'bold'
                      }}>
                        (+{(task.completedPomodoros || 0) - (task.estimatedPomodoros || 1)})
                      </span>
                    )}
                  </TaskProgress>
                </TaskContent>

                <TaskActions>
                  <ActionButton
                    onClick={() => reactivateTask(getTaskId(task))}
                    title="Mark as active"
                  >
                    Reactivate
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
    </TaskListContainer>
  );
};

// Styled components
const TaskListContainer = styled.div`
  width: 100%;
  padding: 0;

  h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    font-size: 1.5rem;
    color: ${props => props.theme['--text-color'] || '#333'};
  }

  h3 {
    margin: 1.5rem 0 1rem;
    font-weight: 500;
    color: ${props => props.theme['--text-color'] || '#555'};
    font-size: 1.2rem;
  }
`;

const AddTaskForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: ${props => props.theme['--card-bg'] || '#f8f9fa'};
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
  }
`;

const TaskInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--accent-color'] || '#d95550'};
    box-shadow: 0 4px 12px rgba(217, 85, 80, 0.1);
  }
`;

const PomodoroInput = styled.div`
  display: flex;
  align-items: center;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  input {
    width: 3rem;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    text-align: center;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: ${props => props.theme['--accent-color'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(217, 85, 80, 0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #c04540;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(217, 85, 80, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const TaskSection = styled.section`
  margin-bottom: 2rem;
`;

const TaskItems = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskItem = styled.li`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: ${props => props.theme['--card-bg'] || '#f8f9fa'};
  border-left: 4px solid ${props =>
    props.isActive ? '#ffc107' :
    props.isCompleted ? '#4caf50' : '#ddd'
  };
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  opacity: ${props => props.isCompleted ? 0.7 : 1};
  margin-bottom: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const TaskContent = styled.div`
  flex: 1;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const TaskTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const TaskProgress = styled.div`
  font-size: 0.85rem;
  color: #777;
`;

const TaskActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.isActive ? '#ffc107' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 50px;
  background-color: ${props => props.isActive ? '#ffc107' : 'transparent'};
  color: ${props => props.isActive ? '#fff' : props.theme['--text-color'] || '#555'};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: ${props => props.isActive ? '#e5ac06' : 'rgba(0, 0, 0, 0.05)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(1px);
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

export default SimpleTaskList;
