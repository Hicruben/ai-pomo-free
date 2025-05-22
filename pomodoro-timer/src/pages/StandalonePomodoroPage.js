import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import SimpleTimerFinal from '../components/SimpleTimerFinal';
import { useGlobalTimer } from '../contexts/GlobalTimerContext';
import { useSettings } from '../context/SettingsContext';
import { isAuthenticated } from '../services/authService';
import { pomodoroApi, taskApi } from '../services/apiService';
import FastTaskList from '../components/FastTaskList';
// We don't need to import the Header component here as it's already included in the parent component

const StandalonePomodoroPage = () => {
  const {
    isRunning,
    isPaused,
    currentSession,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer
  } = useGlobalTimer();

  const { settings } = useSettings();

  // Initialize selected task state from localStorage with user-specific keys
  const [selectedTodoId, setSelectedTodoId] = useState(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Use user-specific key for authenticated users
      const savedTodoId = localStorage.getItem('pomodoroSelectedTodoId_auth');
      return savedTodoId || null;
    } else {
      // Use regular key for non-authenticated users
      const savedTodoId = localStorage.getItem('pomodoroSelectedTodoId');
      return savedTodoId || null;
    }
  });

  const [selectedTodoTitle, setSelectedTodoTitle] = useState(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Use user-specific key for authenticated users
      const savedTodoTitle = localStorage.getItem('pomodoroSelectedTodoTitle_auth');
      return savedTodoTitle || null;
    } else {
      // Use regular key for non-authenticated users
      const savedTodoTitle = localStorage.getItem('pomodoroSelectedTodoTitle');
      return savedTodoTitle || null;
    }
  });

  // Create a ref to the FastTaskList component
  const taskListRef = useRef(null);

  // Save selected task to localStorage when it changes
  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Use user-specific keys for authenticated users
      if (selectedTodoId) {
        localStorage.setItem('pomodoroSelectedTodoId_auth', selectedTodoId);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoId_auth');
      }

      if (selectedTodoTitle) {
        localStorage.setItem('pomodoroSelectedTodoTitle_auth', selectedTodoTitle);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoTitle_auth');
      }

      // Also clear the non-auth keys to prevent conflicts
      localStorage.removeItem('pomodoroSelectedTodoId');
      localStorage.removeItem('pomodoroSelectedTodoTitle');
    } else {
      // Use regular keys for non-authenticated users
      if (selectedTodoId) {
        localStorage.setItem('pomodoroSelectedTodoId', selectedTodoId);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoId');
      }

      if (selectedTodoTitle) {
        localStorage.setItem('pomodoroSelectedTodoTitle', selectedTodoTitle);
      } else {
        localStorage.removeItem('pomodoroSelectedTodoTitle');
      }

      // Also clear the auth keys to prevent conflicts
      localStorage.removeItem('pomodoroSelectedTodoId_auth');
      localStorage.removeItem('pomodoroSelectedTodoTitle_auth');
    }
  }, [selectedTodoId, selectedTodoTitle]);

  // Handle pomodoro completion
  const handlePomodoroCompleted = async (completionData) => {
    console.log('Pomodoro completed:', completionData);

    // If this was a work session and it was completed normally (not interrupted)
    if (currentSession === 'work' && !completionData.wasInterrupted) {
      try {
        // Record the pomodoro in the database if authenticated
        if (isAuthenticated()) {
          await pomodoroApi.createPomodoro({
            taskId: selectedTodoId, // This can be null for standalone pomodoros
            startTime: new Date(Date.now() - settings.workTime * 60 * 1000),
            endTime: new Date(),
            duration: settings.workTime,
            completed: true,
            interrupted: false,
            isStandalone: true // Flag for standalone pomodoros
          });
          console.log('Standalone pomodoro recorded successfully');

          // If a todo was selected, increment its completed pomodoros count
          if (selectedTodoId) {
            try {
              // Update in the database - SimpleTaskList will handle refreshing the UI
              if (isAuthenticated()) {
                // Use the increment endpoint for fast tasks
                console.log('Calling incrementFastTaskPomodoros with ID:', selectedTodoId);
                const updatedTask = await taskApi.incrementFastTaskPomodoros(selectedTodoId);
                console.log('Task updated successfully:', updatedTask);

                // Add a small delay to ensure the database has been updated
                setTimeout(async () => {
                  // Refresh the task list to show updated pomodoro count
                  if (taskListRef.current) {
                    console.log('About to refresh task list, selectedTodoId:', selectedTodoId);
                    await taskListRef.current.refreshTasks();
                    console.log('Task list refreshed after pomodoro completion');
                  } else {
                    console.warn('taskListRef.current is null, cannot refresh tasks');
                  }
                }, 500);
              }

              console.log('Incremented todo completed pomodoros count');
            } catch (error) {
              console.error('Error incrementing todo completed pomodoros:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error recording standalone pomodoro:', error);
      }
    }
  };

  // Handle todo selection for the timer
  const handleTodoSelect = (todoId, todoTitle) => {
    setSelectedTodoId(todoId);
    setSelectedTodoTitle(todoTitle);
  };

  // Clear selected todo
  const clearSelectedTodo = () => {
    setSelectedTodoId(null);
    setSelectedTodoTitle(null);

    // Clear from localStorage based on authentication status
    if (isAuthenticated()) {
      // Clear authenticated user keys
      localStorage.removeItem('pomodoroSelectedTodoId_auth');
      localStorage.removeItem('pomodoroSelectedTodoTitle_auth');
    } else {
      // Clear non-authenticated user keys
      localStorage.removeItem('pomodoroSelectedTodoId');
      localStorage.removeItem('pomodoroSelectedTodoTitle');
    }

    // Also clear the other set of keys to prevent conflicts
    localStorage.removeItem('pomodoroSelectedTodoId');
    localStorage.removeItem('pomodoroSelectedTodoTitle');
    localStorage.removeItem('pomodoroSelectedTodoId_auth');
    localStorage.removeItem('pomodoroSelectedTodoTitle_auth');
  };

  return (
    <PageContainer>
      <ContentContainer>
        <TimerSection>
          <SimpleTimerFinal
            onComplete={handlePomodoroCompleted}
            taskId={selectedTodoId}
            taskName={selectedTodoTitle}
          />
        </TimerSection>

        <TodoSection>
          <FastTaskList
            ref={taskListRef}
            onTaskCompleted={(taskId) => {
              // If the completed task was selected, clear the selection
              if (taskId === selectedTodoId) {
                clearSelectedTodo();
              }
            }}
            onActiveTaskChange={(taskId, task) => {
              // If taskId is null, we're clearing the selection
              if (!taskId) {
                clearSelectedTodo();
                return;
              }

              // Otherwise, we're selecting a task
              const taskTitle = task?.description;
              handleTodoSelect(taskId, taskTitle);
            }}
            activeTaskId={selectedTodoId}
          />
        </TodoSection>
      </ContentContainer>
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled.div`
  min-height: calc(100vh - 60px); /* Adjust for header height */
  background-color: ${props => props.theme['--bg-color'] || '#f5f5f5'};
  color: ${props => props.theme['--text-color']};
  display: flex;
  flex-direction: column;
  width: 100%;
`;





const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  padding: 1.5rem;
  gap: 1rem;
  max-width: 1400px;
  margin: 1.5rem auto 0;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    margin-top: 1rem;
  }
`;

const TimerSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    margin-right: 0;
  }
`;

const TodoSection = styled.section`
  flex: 1.2;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme['--card-bg'] || '#f8f9fa'};
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: auto;
  overflow: visible;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;



export default StandalonePomodoroPage;
