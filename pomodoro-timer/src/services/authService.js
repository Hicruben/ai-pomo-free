import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Register user
export const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password,
    });

    // The backend no longer returns a token on registration
    // Users need to explicitly log in after registration
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    // Clear any existing task data from previous sessions
    localStorage.removeItem('activeTaskCache');
    localStorage.removeItem('pomodoroActiveTaskId');

    // Clear all task-related localStorage items to prevent conflicts between accounts
    localStorage.removeItem('pomodoroSelectedTodoId');
    localStorage.removeItem('pomodoroSelectedTodoTitle');
    localStorage.removeItem('pomodoroSelectedTodoId_auth');
    localStorage.removeItem('pomodoroSelectedTodoTitle_auth');

    // Reset timer state to default work session
    const savedSettings = localStorage.getItem('pomodoroSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      workTime: 25,
      shortBreakTime: 5,
      longBreakTime: 15,
      longBreakInterval: 4,
      autoStartNextSession: false,
      tickingSound: false,
      volume: 50,
      selectedSound: 'bell',
    };

    const defaultTimerState = {
      isRunning: false,
      isPaused: false,
      currentSession: 'work',
      timeRemaining: settings.workTime * 60, // in seconds
      pomodoroCount: 0,
      lastUpdatedTime: Date.now(),
    };

    localStorage.setItem('pomodoroTimerState', JSON.stringify(defaultTimerState));

    // Perform login
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);

      // Log the successful login with user information
      console.log('User logged in successfully:', response.data.user.email);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logout = () => {
  // Clear authentication token
  localStorage.removeItem('token');

  // Clear all task-related localStorage items
  localStorage.removeItem('activeTaskCache');
  localStorage.removeItem('pomodoroActiveTaskId');
  localStorage.removeItem('pomodoroTimerState');

  // Clear all fast task related localStorage items
  localStorage.removeItem('pomodoroSelectedTodoId');
  localStorage.removeItem('pomodoroSelectedTodoTitle');
  localStorage.removeItem('pomodoroSelectedTodoId_auth');
  localStorage.removeItem('pomodoroSelectedTodoTitle_auth');

  // Clear any pending pomodoros
  localStorage.removeItem('pendingPomodoros');

  console.log('User logged out, cleared all task-related localStorage items');
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    const response = await axios.get(`${API_URL}/auth/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};
