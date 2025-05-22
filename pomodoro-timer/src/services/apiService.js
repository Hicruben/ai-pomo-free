import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  transformRequest: [(data) => {
    // Ensure data is properly stringified
    return data ? JSON.stringify(data) : '';
  }]
});

// Log the base URL for debugging
console.log('API Service initialized with baseURL:', API_URL);

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track API calls that are in progress
let apiCallsInProgress = 0;
let isRedirectingToLogin = false;

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors if they're from API calls (not timer completion)
    if (error.response && error.response.status === 401) {
      console.log('Received 401 Unauthorized error');

      // Decrement the API calls counter
      apiCallsInProgress--;

      // Check if this is a timer-related API call
      const isTimerRelatedCall = error.config && (
        error.config.url.includes('/pomodoros') ||
        error.config.url.includes('/active-timer')
      );

      // If this is a timer-related call, just log it and don't redirect
      if (isTimerRelatedCall) {
        console.log('Timer-related API call failed with 401, but not redirecting to login');
        localStorage.removeItem('token');
        return Promise.reject(error);
      }

      // For non-timer calls, redirect to login if not already redirecting
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        console.log('Redirecting to login page due to 401 error');
        localStorage.removeItem('token');

        // Use setTimeout to delay the redirect, giving time for current operations to complete
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

// Track API calls that are starting
api.interceptors.request.use(
  (config) => {
    apiCallsInProgress++;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Export the api instance
export { api };

// Admin API
export const adminApi = {



  // Get quick stats for admin dashboard
  getQuickStats: async () => {
    try {
      const response = await api.get('/admin/stats/quick');
      return response.data;
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  },

  // Get detailed stats for admin dashboard
  getStats: async (params = { timeRange: 'this_week' }) => {
    try {
      const response = await api.get('/admin/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  // Get today's stats for admin dashboard
  getTodayStats: async () => {
    try {
      const response = await api.get('/admin/stats/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today stats:', error);
      throw error;
    }
  },

  // Get users with pagination and filters
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user details
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Get user stats
  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },



  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Update user status (enable/disable)
  updateUserStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },



  // Reset user password
  resetUserPassword: async (userId, tempPassword) => {
    try {
      const response = await api.post(`/admin/users/${userId}/reset-password`, { tempPassword });
      return response.data;
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  },

  // Send message to user
  sendUserMessage: async (userId, messageData) => {
    try {
      const response = await api.post(`/admin/users/${userId}/message`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message to user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Database Backup methods
  createBackup: async (description) => {
    try {
      const response = await api.post('/admin/backups', { description });
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  getBackups: async () => {
    try {
      const response = await api.get('/admin/backups');
      return response.data;
    } catch (error) {
      console.error('Error fetching backups:', error);
      throw error;
    }
  },

  downloadBackup: (backupId) => {
    // Return the URL for direct download
    return `${API_URL}/admin/backups/${backupId}/download`;
  },

  deleteBackup: async (backupId) => {
    try {
      const response = await api.delete(`/admin/backups/${backupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  },

  restoreBackup: async (backupId) => {
    try {
      const response = await api.post(`/admin/backups/${backupId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  },

  updateBackupSettings: async (settings) => {
    try {
      const response = await api.put('/admin/backups/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating backup settings:', error);
      throw error;
    }
  },
};





// Task API
export const taskApi = {
  // Fast tasks API
  getFastTasks: async () => {
    try {
      const response = await api.get('/fast-tasks');
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error getting fast tasks:', error);
      throw error;
    }
  },

  getFastTask: async (taskId) => {
    try {
      const response = await api.get(`/fast-tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error getting fast task:', error);
      throw error;
    }
  },

  createFastTask: async (taskData) => {
    try {
      const response = await api.post('/fast-tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error creating fast task:', error);
      throw error;
    }
  },

  updateFastTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/fast-tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error updating fast task:', error);
      throw error;
    }
  },

  deleteFastTask: async (taskId) => {
    try {
      const response = await api.delete(`/fast-tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error deleting fast task:', error);
      throw error;
    }
  },

  incrementFastTaskPomodoros: async (taskId) => {
    try {
      const response = await api.put(`/fast-tasks/${taskId}/increment`);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error incrementing fast task pomodoros:', error);
      throw error;
    }
  },

  // Standalone tasks API
  getStandaloneTasks: async () => {
    try {
      const response = await api.get('/standalone-tasks');
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error getting standalone tasks:', error);
      throw error;
    }
  },

  createStandaloneTask: async (taskData) => {
    try {
      const response = await api.post('/standalone-tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error creating standalone task:', error);
      throw error;
    }
  },

  updateStandaloneTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/standalone-tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error updating standalone task:', error);
      throw error;
    }
  },

  deleteStandaloneTask: async (taskId) => {
    try {
      const response = await api.delete(`/standalone-tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error deleting standalone task:', error);
      throw error;
    }
  },

  incrementStandaloneTaskPomodoros: async (taskId) => {
    try {
      const response = await api.put(`/standalone-tasks/${taskId}/increment`);
      return response.data;
    } catch (error) {
      console.error('[taskApi] Error incrementing standalone task pomodoros:', error);
      throw error;
    }
  },

  // Regular tasks API
  // Get all tasks or a single task by ID
  getTasks: async (taskId, projectId, cacheBuster) => {
    try {
      if (taskId) {
        // Ensure taskId is a string and not an object
        const taskIdStr = typeof taskId === 'object' ?
          (taskId._id || taskId.id || taskId.toString()) :
          taskId;

        // Get a single task
        console.log(`[taskApi] Getting task with ID: ${taskIdStr}, cacheBuster: ${cacheBuster}`);

        // Add cache-busting parameter if provided
        const url = cacheBuster ?
          `/tasks/${taskIdStr}?_=${cacheBuster}` :
          `/tasks/${taskIdStr}`;

        const response = await api.get(url);

        // Log the response for debugging
        console.log(`[taskApi] Task data received:`, response.data);
        if (response.data) {
          console.log(`[taskApi] Task completedPomodoros: ${response.data.completedPomodoros}`);
        }

        return response.data;
      } else {
        // Get all tasks, optionally filtered by project
        // Ensure projectId is a string if it's an object
        let projectIdParam = projectId;
        if (projectId && typeof projectId === 'object') {
          projectIdParam = projectId._id || projectId.id || projectId.toString();
        }

        const params = projectIdParam ? { projectId: projectIdParam } : {};

        // Add cache-busting parameter if provided
        if (cacheBuster) {
          params._cache = cacheBuster;
        }

        console.log(`[taskApi] Getting tasks with params:`, params);
        const response = await api.get('/tasks', { params });
        return response.data;
      }
    } catch (error) {
      console.error(`[taskApi] Error getting tasks:`, error);
      throw error;
    }
  },

  // Create a task
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a task
  updateTask: async (taskId, taskData) => {
    try {
      // Ensure taskId is a string and not an object
      const taskIdStr = typeof taskId === 'object' ?
        (taskId._id || taskId.id || taskId.toString()) :
        taskId;

      const response = await api.put(`/tasks/${taskIdStr}`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      // Ensure taskId is a string and not an object
      const taskIdStr = typeof taskId === 'object' ?
        (taskId._id || taskId.id || taskId.toString()) :
        taskId;

      const response = await api.delete(`/tasks/${taskIdStr}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Import tasks from Todoist
  importTodoistTasks: async (tasks) => {
    try {
      const response = await api.post('/tasks/import/todoist', { tasks });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Pomodoro API
export const pomodoroApi = {
  // Flag to prevent duplicate API calls
  lastPomodoroCreationTime: 0,

  // Get all pomodoros
  getPomodoros: async (startDate, endDate) => {
    try {
      let url = '/pomodoros';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a pomodoro
  createPomodoro: async (pomodoroData) => {
    try {
      console.log(`[pomodoroApi] Creating pomodoro with data:`, pomodoroData);
      console.log(`[pomodoroApi] Original taskId: ${pomodoroData.taskId}, type: ${typeof pomodoroData.taskId}`);

      // GLOBAL RATE LIMITING: Only allow one API call per 5 seconds
      const now = Date.now();
      const timeSinceLastCall = now - pomodoroApi.lastPomodoroCreationTime;

      if (pomodoroApi.lastPomodoroCreationTime > 0 && timeSinceLastCall < 5000) {
        console.log(`[pomodoroApi] PREVENTING DUPLICATE API CALL - Last call was ${timeSinceLastCall}ms ago`);
        return { message: 'Duplicate call prevented' };
      }

      // Update the last creation time
      pomodoroApi.lastPomodoroCreationTime = now;

      // Create a copy of the data to avoid modifying the original
      const dataToSend = { ...pomodoroData };

      // Ensure taskId is a string if it's provided
      if (dataToSend.taskId) {
        // Convert taskId to string if it's an object
        if (typeof dataToSend.taskId === 'object') {
          console.log(`[pomodoroApi] TaskId is an object:`, dataToSend.taskId);
          if (dataToSend.taskId._id) {
            dataToSend.taskId = dataToSend.taskId._id;
            console.log(`[pomodoroApi] Using taskId._id: ${dataToSend.taskId}`);
          } else if (dataToSend.taskId.id) {
            dataToSend.taskId = dataToSend.taskId.id;
            console.log(`[pomodoroApi] Using taskId.id: ${dataToSend.taskId}`);
          } else {
            dataToSend.taskId = dataToSend.taskId.toString();
            console.log(`[pomodoroApi] Using taskId.toString(): ${dataToSend.taskId}`);
          }
        }

        // Ensure it's a string
        dataToSend.taskId = String(dataToSend.taskId);
        console.log(`[pomodoroApi] Final taskId after conversion: ${dataToSend.taskId}, type: ${typeof dataToSend.taskId}`);
      }

      // Ensure projectId is a string and properly formatted
      if (dataToSend.projectId) {
        // Convert projectId to string if it's an object
        if (typeof dataToSend.projectId === 'object') {
          console.log(`[pomodoroApi] ProjectId is an object:`, dataToSend.projectId);
          if (dataToSend.projectId._id) {
            dataToSend.projectId = dataToSend.projectId._id;
            console.log(`[pomodoroApi] Using projectId._id: ${dataToSend.projectId}`);
          } else if (dataToSend.projectId.id) {
            dataToSend.projectId = dataToSend.projectId.id;
            console.log(`[pomodoroApi] Using projectId.id: ${dataToSend.projectId}`);
          } else {
            dataToSend.projectId = dataToSend.projectId.toString();
            console.log(`[pomodoroApi] Using projectId.toString(): ${dataToSend.projectId}`);
          }
        }

        // Ensure it's a string
        dataToSend.projectId = String(dataToSend.projectId);
        console.log(`[pomodoroApi] Final projectId after conversion: ${dataToSend.projectId}, type: ${typeof dataToSend.projectId}`);
      } else {
        console.log(`[pomodoroApi] ERROR: No projectId provided in pomodoroData`);
        throw new Error('Project ID is required to create a pomodoro');
      }

      console.log(`[pomodoroApi] Sending data to server:`, dataToSend);
      const response = await api.post('/pomodoros', dataToSend);
      console.log(`[pomodoroApi] Pomodoro created successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[pomodoroApi] Error creating pomodoro:`, error);

      // Special handling for 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        console.error(`[pomodoroApi] Authentication error (401) - Token may have expired`);
        console.error(`[pomodoroApi] Saving pomodoro data to localStorage for later sync`);

        try {
          // Save the pomodoro data to localStorage for potential later sync
          const pendingPomodoros = JSON.parse(localStorage.getItem('pendingPomodoros') || '[]');
          pendingPomodoros.push({
            ...pomodoroData,
            timestamp: Date.now(),
            error: 'Authentication expired during timer completion'
          });
          localStorage.setItem('pendingPomodoros', JSON.stringify(pendingPomodoros));

          // Return a "success" response to prevent UI disruption
          return {
            success: false,
            message: 'Authentication expired, pomodoro saved locally',
            savedLocally: true
          };
        } catch (storageError) {
          console.error(`[pomodoroApi] Error saving to localStorage:`, storageError);
        }
      }

      // Log detailed error information
      if (error.response) {
        console.error(`[pomodoroApi] Error status: ${error.response.status}`);
        console.error(`[pomodoroApi] Error data:`, error.response.data);
      } else if (error.request) {
        console.error(`[pomodoroApi] No response received:`, error.request);
      } else {
        console.error(`[pomodoroApi] Error message: ${error.message}`);
      }
      console.error(`[pomodoroApi] Error stack:`, error.stack);

      // For timer-related errors, return a partial success to prevent UI disruption
      return {
        success: false,
        message: 'Error creating pomodoro, but timer UI updated',
        error: error.message
      };
    }
  },

  // Delete a pomodoro
  deletePomodoro: async (pomodoroId) => {
    try {
      const response = await api.delete(`/pomodoros/${pomodoroId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Stats API
export const statsApi = {
  // Get stats
  getStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update achievements
  updateAchievements: async (achievements) => {
    try {
      const response = await api.put('/stats/achievements', { achievements });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Aggregate pomodoro data
  aggregatePomodoros: async () => {
    try {
      const response = await api.post('/aggregate/pomodoros');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User API
export const userApi = {
  // Update user settings
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/users/settings', { settings });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/users/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Set active task
  setActiveTask: async (taskId) => {
    try {
      // Handle null/undefined case (clearing active task)
      if (!taskId) {
        const response = await api.put('/users/active-task', { taskId: null });
        return response.data;
      }

      // Ensure taskId is a string and not an object
      const taskIdStr = typeof taskId === 'object' ?
        (taskId._id || taskId.id || taskId.toString()) :
        taskId;

      const response = await api.put('/users/active-task', { taskId: taskIdStr });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get active task
  getActiveTask: async () => {
    try {
      const response = await api.get('/users/active-task');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Project API
export const projectApi = {
  // Get all projects
  getProjects: async (status) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a project by ID
  getProject: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a project
  createProject: async (projectData) => {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },

  // Update a project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Set project as working
  setProjectAsWorking: async (projectId) => {
    try {
      const response = await api.put(`/projects/${projectId}/working`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark project as finished
  finishProject: async (projectId) => {
    try {
      const response = await api.put(`/projects/${projectId}/finish`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Increment project's pomodoro count
  incrementPomodoros: async (projectId) => {
    try {
      const response = await api.put(`/projects/${projectId}/pomodoros`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update project positions
  updateProjectPositions: async (positions) => {
    try {
      const response = await api.put('/projects/positions', { positions });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Milestone API
export const milestoneApi = {
  // Get all milestones for a project
  getMilestones: async (projectId) => {
    try {
      console.log(`Getting milestones for project: ${projectId}`);
      const response = await api.get(`/projects/${projectId}/milestones`);
      console.log(`Received ${response.data.length} milestones`);
      return response.data;
    } catch (error) {
      console.error('Error getting milestones:', error);
      throw error;
    }
  },

  // Create a milestone
  createMilestone: async (projectId, milestoneData) => {
    try {
      console.log(`Creating milestone for project: ${projectId}`, milestoneData);
      const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
      console.log('Milestone created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  },

  // Update a milestone
  updateMilestone: async (milestoneId, milestoneData) => {
    try {
      console.log(`Updating milestone: ${milestoneId}`, milestoneData);
      const response = await api.put(`/milestones/${milestoneId}`, milestoneData);
      console.log('Milestone updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  },

  // Delete a milestone
  deleteMilestone: async (milestoneId) => {
    try {
      console.log(`Deleting milestone: ${milestoneId}`);
      const response = await api.delete(`/milestones/${milestoneId}`);
      console.log('Milestone deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  },
};

// Note API
export const noteApi = {
  // Get all notes for a project
  getNotes: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/notes`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a note
  createNote: async (projectId, noteData) => {
    try {
      const response = await api.post(`/projects/${projectId}/notes`, noteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a note
  updateNote: async (noteId, noteData) => {
    try {
      const response = await api.put(`/projects/notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    try {
      const response = await api.delete(`/projects/notes/${noteId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Reminders API
export const remindersApi = {
  getReminders: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },
  createReminder: async (reminderData) => {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  },
  updateReminder: async (id, reminderData) => {
    const response = await api.put(`/reminders/${id}`, reminderData);
    return response.data;
  },
  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};

// Countdowns API
export const countdownsApi = {
  getCountdowns: async () => {
    const response = await api.get('/countdowns');
    return response.data;
  },
  createCountdown: async (countdownData) => {
    const response = await api.post('/countdowns', countdownData);
    return response.data;
  },
  updateCountdown: async (id, countdownData) => {
    const response = await api.put(`/countdowns/${id}`, countdownData);
    return response.data;
  },
  deleteCountdown: async (id) => {
    const response = await api.delete(`/countdowns/${id}`);
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  // Get user settings
  getSettings: async () => {
    try {
      const response = await api.get('/users/settings');
      return response.data.settings || {};
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },

  // Update user settings
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/users/settings', { settings });
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};
