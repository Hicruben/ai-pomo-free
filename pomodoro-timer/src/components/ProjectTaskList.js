import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { isAuthenticated } from '../services/authService';
import { taskApi } from '../services/apiService';
import { TomatoSVG } from './PomodoroIcon';

const ProjectTaskList = ({
  tasks,
  projectId,
  onTaskCompleted,
  onActiveTaskChange,
  activeTaskId,
  onTasksUpdate
}) => {
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimatedPomodoros, setNewTaskEstimatedPomodoros] = useState(1);

  // Get active task object
  const activeTask = tasks.find(task =>
    (task._id && task._id === activeTaskId) ||
    (task.id && task.id === activeTaskId)
  );

  // Set a task as active
  const setTaskAsActive = (task) => {
    console.log('Setting task as active:', task);
    if (onActiveTaskChange) {
      // Extract the string ID from the task
      let taskId = null;
      if (task._id) {
        taskId = typeof task._id === 'object' ? task._id.toString() : task._id;
      } else if (task.id) {
        taskId = typeof task.id === 'object' ? task.id.toString() : task.id;
      }
      console.log('Extracted task ID:', taskId);
      onActiveTaskChange(taskId);
    }
  };

  // Mark a task as completed
  const completeTask = async (taskId) => {
    try {
      // Ensure taskId is a string
      const taskIdStr = typeof taskId === 'object' ? taskId.toString() : taskId;
      console.log('Completing task with ID:', taskIdStr);

      if (isAuthenticated()) {
        try {
          // Update task via API if authenticated
          await taskApi.updateTask(taskIdStr, { completed: true });
          console.log('Task marked as completed via API');

          // Refresh tasks
          const updatedTasks = await taskApi.getTasks(null, projectId);
          if (onTasksUpdate) {
            onTasksUpdate(updatedTasks);
          }

          // If the completed task was active, clear the active task
          if ((taskIdStr === activeTaskId || taskId === activeTaskId) && onActiveTaskChange) {
            onActiveTaskChange(null);
          }

          // Call the onTaskCompleted callback if provided
          if (onTaskCompleted) {
            onTaskCompleted(taskIdStr);
          }
        } catch (apiError) {
          console.error('API error completing task:', apiError);

          // Fallback to local update if API fails
          const task = tasks.find(t => (t._id === taskIdStr || t.id === taskIdStr));
          if (task) {
            const updatedTask = { ...task, completed: true };
            const updatedTasks = tasks.map(t =>
              (t._id === taskIdStr || t.id === taskIdStr) ? updatedTask : t
            );
            if (onTasksUpdate) {
              onTasksUpdate(updatedTasks);
            }
          }
        }
      } else {
        // Update localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const updatedTasks = parsedTasks.map(task =>
          (task.id === taskIdStr || task._id === taskIdStr) ? { ...task, completed: true } : task
        );
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

        // Update the tasks in the parent component
        if (onTasksUpdate) {
          const projectTasks = updatedTasks.filter(task => task.projectId === projectId);
          onTasksUpdate(projectTasks);
        }

        // If the completed task was active, clear the active task
        if ((taskIdStr === activeTaskId || taskId === activeTaskId) && onActiveTaskChange) {
          onActiveTaskChange(null);
        }

        // Call the onTaskCompleted callback if provided
        if (onTaskCompleted) {
          onTaskCompleted(taskIdStr);
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Add a new task
  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setLoadingTasks(true);

      const newTask = {
        title: newTaskTitle,
        estimatedPomodoros: newTaskEstimatedPomodoros,
        completedPomodoros: 0,
        completed: false,
        projectId: projectId
      };

      if (isAuthenticated()) {
        // Add task via API if authenticated
        const createdTask = await taskApi.createTask(newTask);

        // Refresh tasks
        const updatedTasks = await taskApi.getTasks(null, projectId);
        if (onTasksUpdate) {
          onTasksUpdate(updatedTasks);
        }
      } else {
        // Add to localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        // Generate a unique ID for the new task
        const newTaskWithId = {
          ...newTask,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        const updatedTasks = [...parsedTasks, newTaskWithId];
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

        // Update the tasks in the parent component
        if (onTasksUpdate) {
          const projectTasks = updatedTasks.filter(task => task.projectId === projectId);
          onTasksUpdate(projectTasks);
        }
      }

      // Reset form
      setNewTaskTitle('');
      setNewTaskEstimatedPomodoros(1);
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      // Ensure taskId is a string
      const taskIdStr = typeof taskId === 'object' ? taskId.toString() : taskId;
      console.log('Deleting task with ID:', taskIdStr);

      if (isAuthenticated()) {
        try {
          // Delete task via API if authenticated
          await taskApi.deleteTask(taskIdStr);
          console.log('Task deleted via API');

          // Refresh tasks
          const updatedTasks = await taskApi.getTasks(null, projectId);
          if (onTasksUpdate) {
            onTasksUpdate(updatedTasks);
          }

          // If the deleted task was active, clear the active task
          if ((taskIdStr === activeTaskId || taskId === activeTaskId) && onActiveTaskChange) {
            onActiveTaskChange(null);
          }
        } catch (apiError) {
          console.error('API error deleting task:', apiError);

          // Fallback to local update if API fails
          const updatedTasks = tasks.filter(t =>
            t._id !== taskIdStr && t.id !== taskIdStr
          );
          if (onTasksUpdate) {
            onTasksUpdate(updatedTasks);
          }

          // If the deleted task was active, clear the active task
          if ((taskIdStr === activeTaskId || taskId === activeTaskId) && onActiveTaskChange) {
            onActiveTaskChange(null);
          }
        }
      } else {
        // Delete from localStorage
        const savedTasks = localStorage.getItem('pomodoroTasks');
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
        const updatedTasks = parsedTasks.filter(task =>
          task.id !== taskIdStr && task._id !== taskIdStr
        );
        localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

        // Update the tasks in the parent component
        if (onTasksUpdate) {
          const projectTasks = updatedTasks.filter(task => task.projectId === projectId);
          onTasksUpdate(projectTasks);
        }

        // If the deleted task was active, clear the active task
        if ((taskIdStr === activeTaskId || taskId === activeTaskId) && onActiveTaskChange) {
          onActiveTaskChange(null);
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Separate active and completed tasks
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <TaskListContainer>
      <TaskListHeader>
        <span>Tasks</span>
        <AddTaskButton onClick={() => setIsAddingTask(true)}>+ Add Task</AddTaskButton>
      </TaskListHeader>

      {isAddingTask && (
        <AddTaskForm>
          <TaskInput
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
          />
          <PomodoroInput>
            <label>
              Est. Pomodoros:
              <input
                type="number"
                min="1"
                max="10"
                value={newTaskEstimatedPomodoros}
                onChange={(e) => setNewTaskEstimatedPomodoros(parseInt(e.target.value) || 1)}
              />
            </label>
          </PomodoroInput>
          <AddTaskActions>
            <CancelButton onClick={() => setIsAddingTask(false)}>Cancel</CancelButton>
            <SaveButton onClick={addTask} disabled={!newTaskTitle.trim()}>Add Task</SaveButton>
          </AddTaskActions>
        </AddTaskForm>
      )}

      {loadingTasks ? (
        <LoadingMessage>Loading tasks...</LoadingMessage>
      ) : (
        <TaskListContent>
          {/* Active Tasks */}
          {activeTasks.length === 0 ? (
            <EmptyMessage>No active tasks. Add a task to get started!</EmptyMessage>
          ) : (
            <TaskList>
              {activeTasks.map((task) => (
                <TaskItem
                  key={task._id || task.id}
                  $isActive={activeTaskId && (
                    (task._id && (task._id === activeTaskId || task._id.toString() === activeTaskId)) ||
                    (task.id && (task.id === activeTaskId || task.id.toString() === activeTaskId))
                  )}
                  $isCompleted={false}
                  onClick={() => !task.completed && setTaskAsActive(task)}
                >
                  <TaskContent>
                    <TaskName $isCompleted={false}>
                      {task.title || task.name}
                    </TaskName>

                    {/* Display subtasks if they exist */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <SubtaskList>
                        {task.subtasks.map(subtask => (
                          <SubtaskItem key={subtask.id}>
                            <SubtaskCheckbox
                              type="checkbox"
                              checked={!!subtask.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                // Toggle subtask completion
                                const updatedSubtasks = task.subtasks.map(st =>
                                  st.id === subtask.id ? { ...st, completed: !st.completed } : st
                                );

                                // Update the task with the modified subtasks
                                if (isAuthenticated()) {
                                  const taskId = task._id || task.id;
                                  taskApi.updateTask(taskId, { subtasks: updatedSubtasks })
                                    .then(() => {
                                      // Refresh tasks after update
                                      return taskApi.getTasks(null, projectId);
                                    })
                                    .then(updatedTasks => {
                                      if (onTasksUpdate) {
                                        onTasksUpdate(updatedTasks);
                                      }
                                    })
                                    .catch(error => {
                                      console.error('Error updating subtask:', error);
                                    });
                                } else {
                                  // Update in localStorage for non-authenticated users
                                  const savedTasks = localStorage.getItem('pomodoroTasks');
                                  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
                                  const updatedTasks = parsedTasks.map(t =>
                                    (t.id === task.id || t._id === task._id) ? { ...t, subtasks: updatedSubtasks } : t
                                  );
                                  localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

                                  // Update the tasks in the parent component
                                  if (onTasksUpdate) {
                                    const projectTasks = updatedTasks.filter(t => t.projectId === projectId);
                                    onTasksUpdate(projectTasks);
                                  }
                                }
                              }}
                            />
                            <SubtaskText $isCompleted={subtask.completed}>
                              {subtask.title}
                              {subtask.estimatedPomodoros && (
                                <SubtaskPomodoros>
                                  ({subtask.estimatedPomodoros} <TomatoSVG size={16} color="#bbb" />)
                                </SubtaskPomodoros>
                              )}
                            </SubtaskText>
                            <RemoveSubtaskButton
                              onClick={(e) => {
                                e.stopPropagation();
                                // Delete subtask
                                const updatedSubtasks = task.subtasks.filter(st => st.id !== subtask.id);

                                // Update the task with the modified subtasks
                                if (isAuthenticated()) {
                                  const taskId = task._id || task.id;
                                  taskApi.updateTask(taskId, { subtasks: updatedSubtasks })
                                    .then(() => {
                                      // Refresh tasks after update
                                      return taskApi.getTasks(null, projectId);
                                    })
                                    .then(updatedTasks => {
                                      if (onTasksUpdate) {
                                        onTasksUpdate(updatedTasks);
                                      }
                                    })
                                    .catch(error => {
                                      console.error('Error deleting subtask:', error);
                                    });
                                } else {
                                  // Update in localStorage for non-authenticated users
                                  const savedTasks = localStorage.getItem('pomodoroTasks');
                                  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
                                  const updatedTasks = parsedTasks.map(t =>
                                    (t.id === task.id || t._id === task._id) ? { ...t, subtasks: updatedSubtasks } : t
                                  );
                                  localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));

                                  // Update the tasks in the parent component
                                  if (onTasksUpdate) {
                                    const projectTasks = updatedTasks.filter(t => t.projectId === projectId);
                                    onTasksUpdate(projectTasks);
                                  }
                                }
                              }}
                            >×</RemoveSubtaskButton>
                          </SubtaskItem>
                        ))}
                      </SubtaskList>
                    )}

                    <TaskActions>
                      <TaskProgress>
                        <span style={{ color: '#e11d48' }}>{task.completedPomodoros || 0}</span>/<span style={{ color: '#888' }}>{task.estimatedPomodoros || 1}</span> <TomatoSVG size={18} color="#bbb" />
                      </TaskProgress>
                      <ActionButton onClick={(e) => {
                        e.stopPropagation();
                        const taskId = task._id || task.id;
                        completeTask(taskId);
                      }} title="Complete task">
                        ✓
                      </ActionButton>
                      <ActionButton onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this task?')) {
                          const taskId = task._id || task.id;
                          deleteTask(taskId);
                        }
                      }} title="Delete task">
                        ×
                      </ActionButton>
                    </TaskActions>
                  </TaskContent>
                </TaskItem>
              ))}
            </TaskList>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <>
              <CompletedTasksHeader>Completed Tasks</CompletedTasksHeader>
              <TaskList>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task._id || task.id}
                    $isActive={false}
                    $isCompleted={true}
                  >
                    <TaskContent>
                      <TaskName $isCompleted={true}>
                        {task.title || task.name}
                      </TaskName>

                      {/* Display subtasks if they exist */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <SubtaskList>
                          {task.subtasks.map(subtask => (
                            <SubtaskItem key={subtask.id}>
                              <SubtaskCheckbox
                                type="checkbox"
                                checked={true}
                                disabled={true}
                              />
                              <SubtaskText $isCompleted={true}>
                                {subtask.title}
                                {subtask.estimatedPomodoros && (
                                  <SubtaskPomodoros>
                                    ({subtask.estimatedPomodoros} <TomatoSVG size={16} color="#bbb" />)
                                  </SubtaskPomodoros>
                                )}
                              </SubtaskText>
                            </SubtaskItem>
                          ))}
                        </SubtaskList>
                      )}

                      <TaskActions>
                        <TaskProgress>
                          <span style={{ color: '#e11d48' }}>{task.completedPomodoros || 0}</span>/<span style={{ color: '#888' }}>{task.estimatedPomodoros || 1}</span> <TomatoSVG size={18} color="#bbb" />
                        </TaskProgress>
                        <ActionButton onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            const taskId = task._id || task.id;
                            deleteTask(taskId);
                          }
                        }} title="Delete task">
                          ×
                        </ActionButton>
                      </TaskActions>
                    </TaskContent>
                  </TaskItem>
                ))}
              </TaskList>
            </>
          )}
        </TaskListContent>
      )}
    </TaskListContainer>
  );
};

// Styled components
const TaskListContainer = styled.div`
  width: 100%;
  background-color: ${props => props.theme['--card-bg'] || '#ffffff'};
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TaskListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: ${props => props.theme['--header-bg'] || '#f5f5f5'};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
  font-size: 1.1rem;
`;

const AddTaskButton = styled.button`
  background-color: ${props => props.theme['--nav-active-bg'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme['--nav-active-bg-hover'] || '#c94540'};
  }
`;

const TaskListContent = styled.div`
  padding: 1rem;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TaskItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: ${props => props.$isActive ? 'rgba(76, 145, 149, 0.1)' : 'white'};
  border-radius: 0.25rem;
  border: 1px solid ${props => props.$isActive ? 'rgba(76, 145, 149, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  cursor: ${props => props.$isCompleted ? 'default' : 'pointer'};
  opacity: ${props => props.$isCompleted ? 0.6 : 1};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$isCompleted ? 'white' : props.$isActive ? 'rgba(76, 145, 149, 0.15)' : 'rgba(0, 0, 0, 0.02)'};
  }
`;

const TaskContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TaskName = styled.div`
  font-weight: 500;
  text-decoration: ${props => props.$isCompleted ? 'line-through' : 'none'};
  color: ${props => props.$isCompleted ? '#888' : props.theme['--text-color'] || '#333'};
  flex: 1;
  margin-bottom: ${props => props.$hasSubtasks ? '0.5rem' : '0'};
`;

const TaskActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TaskProgress = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  white-space: nowrap;
  background-color: rgba(76, 145, 149, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  min-width: 70px;
  text-align: center;
  font-weight: 500;
`;

const SubtaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 1rem;
  border-left: 2px solid rgba(76, 145, 149, 0.2);
  padding-left: 0.75rem;
`;

const SubtaskItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
`;

const SubtaskCheckbox = styled.input`
  margin-right: 0.5rem;
  cursor: pointer;
`;

const SubtaskText = styled.span`
  text-decoration: ${props => props.$isCompleted ? 'line-through' : 'none'};
  color: ${props => props.$isCompleted ? '#888' : props.theme['--text-color'] || '#333'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SubtaskPomodoros = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  opacity: 0.8;
`;

const RemoveSubtaskButton = styled.button`
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 1.1rem;
  cursor: pointer;
  margin-left: auto;
  padding: 0 0.25rem;
  &:hover { color: #b91c1c; }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: ${props => props.theme['--text-color'] || '#333'};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-style: italic;
`;

const CompletedTasksHeader = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem 0;
  color: ${props => props.theme['--text-color'] || '#333'};
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const AddTaskForm = styled.div`
  padding: 1rem;
  background-color: ${props => props.theme['--card-bg'] || '#ffffff'};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const TaskInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  font-size: 1rem;
  margin-bottom: 0.75rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme['--nav-active-bg'] || '#d95550'};
    box-shadow: 0 0 0 2px rgba(217, 85, 80, 0.2);
  }
`;

const PomodoroInput = styled.div`
  margin-bottom: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: ${props => props.theme['--text-secondary'] || '#666'};

    input {
      width: 60px;
      padding: 0.5rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.25rem;
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: ${props => props.theme['--nav-active-bg'] || '#d95550'};
      }
    }
  }
`;

const AddTaskActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SaveButton = styled.button`
  background-color: ${props => props.theme['--nav-active-bg'] || '#d95550'};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme['--nav-active-bg-hover'] || '#c94540'};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default ProjectTaskList;
