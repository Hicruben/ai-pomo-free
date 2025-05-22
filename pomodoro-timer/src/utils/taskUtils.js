// Utility functions for task management, especially for localStorage

// Get tasks for a specific project from localStorage
export const getTasksFromLocalStorage = (projectId) => {
  const savedTasks = localStorage.getItem('pomodoroTasks');
  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
  return parsedTasks.filter(task => task.projectId === projectId);
};

// Get all tasks from localStorage
export const getAllTasksFromLocalStorage = () => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
};

// Save all tasks to localStorage
export const saveTasksToLocalStorage = (tasks) => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
};

// Add other task-related utility functions as needed... 