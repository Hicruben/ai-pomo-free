import React from 'react';
import styled from 'styled-components';
import { TomatoSVG } from './PomodoroIcon';

const SimplifiedProjectTaskList = ({
  tasks,
  projectId,
  onActiveTaskChange,
  activeTaskId
}) => {
  // Separate active and completed tasks
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

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

      // Check if a timer is running by looking at localStorage
      const timerStateJson = localStorage.getItem('pomodoroTimerState');
      if (timerStateJson) {
        try {
          const timerState = JSON.parse(timerStateJson);
          // If timer is running, show a browser confirm dialog
          if (timerState.isRunning && !timerState.isPaused) {
            console.log('Timer is running, showing confirmation dialog');

            const confirmed = window.confirm("Switching active tasks will reset your current Pomodoro timer. Any progress on the current timer will be lost. Do you want to continue?");

            if (!confirmed) {
              console.log('User cancelled task switch');
              return;
            }

            // If confirmed, proceed with changing the active task
            console.log('User confirmed task switch, proceeding');
          }
        } catch (e) {
          console.error('Error parsing timer state:', e);
        }
      }

      // Proceed with changing the active task
      onActiveTaskChange(task);
    }
  };

  return (
    <TaskListContainer>
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <EmptyMessage>No tasks available in this project</EmptyMessage>
      ) : (
        <TaskListContent>
          {/* Active Tasks */}
          {activeTasks.length === 0 ? (
            <EmptyMessage>No active tasks in this project</EmptyMessage>
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
                              readOnly
                              disabled
                            />
                            <SubtaskText $isCompleted={subtask.completed}>
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
                        <span style={{ color: '#e11d48' }}>{task.completedPomodoros || 0}</span>/<span style={{ color: '#888' }}>{task.estimatedPomodoros || 1}</span>
                        <TomatoSVG size={18} color="#bbb" />
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
                      <SetActiveButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskAsActive(task);
                        }}
                        $isActive={activeTaskId && (
                          (task._id && (task._id === activeTaskId || task._id.toString() === activeTaskId)) ||
                          (task.id && (task.id === activeTaskId || task.id.toString() === activeTaskId))
                        )}
                      >
                        {activeTaskId && (
                          (task._id && (task._id === activeTaskId || task._id.toString() === activeTaskId)) ||
                          (task.id && (task.id === activeTaskId || task.id.toString() === activeTaskId))
                        ) ? '✓ Active' : 'Set Active'}
                      </SetActiveButton>
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
                          <span style={{ color: '#e11d48' }}>{task.completedPomodoros || 0}</span>/<span style={{ color: '#888' }}>{task.estimatedPomodoros || 1}</span>
                          <TomatoSVG size={18} color="#bbb" />
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
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
  width: 100%;
`;

const TaskProgress = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  white-space: nowrap;
  background-color: rgba(76, 145, 149, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  width: fit-content;
  text-align: center;
  font-weight: 500;
`;

const SetActiveButton = styled.button`
  background-color: ${props => props.$isActive ? '#4caf50' : '#2196f3'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.$isActive ? '#45a049' : '#0b7dda'};
  }
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
  cursor: default;
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

const CompletedTasksHeader = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem 0;
  color: ${props => props.theme['--text-color'] || '#333'};
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme['--text-secondary'] || '#666'};
  font-style: italic;
`;

export default SimplifiedProjectTaskList;
