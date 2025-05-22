// Todoist API base URL
const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

// Get tasks from Todoist
export const getTodoistTasks = async (token) => {
  try {
    const response = await fetch(`${TODOIST_API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.status}`);
    }
    
    const tasks = await response.json();
    return tasks;
  } catch (error) {
    console.error('Error fetching Todoist tasks:', error);
    throw error;
  }
};

// Close (complete) a task in Todoist
export const closeTodoistTask = async (token, taskId) => {
  try {
    const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error closing Todoist task:', error);
    throw error;
  }
};

// Create a new task in Todoist
export const createTodoistTask = async (token, taskData) => {
  try {
    const response = await fetch(`${TODOIST_API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.status}`);
    }
    
    const task = await response.json();
    return task;
  } catch (error) {
    console.error('Error creating Todoist task:', error);
    throw error;
  }
};

// Parse Pomodoro count from task content
export const parsePomodoroCount = (content) => {
  // Look for patterns like "🍅", "🍅🍅", or "🍅 x 3"
  const pomodoroEmoji = '🍅';
  
  // Count consecutive pomodoro emojis
  let count = 0;
  let i = 0;
  while (i < content.length) {
    if (content.substring(i, i + pomodoroEmoji.length) === pomodoroEmoji) {
      count++;
      i += pomodoroEmoji.length;
    } else {
      break;
    }
  }
  
  if (count > 0) {
    return count;
  }
  
  // Look for "🍅 x N" pattern
  const match = content.match(/🍅\s*x\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1]);
  }
  
  return 0;
};

// Format task for display
export const formatTodoistTask = (task) => {
  const estimatedPomodoros = parsePomodoroCount(task.content);
  
  // Remove pomodoro emojis and "x N" from content for display
  let displayContent = task.content
    .replace(/🍅+/g, '')
    .replace(/\s*x\s*\d+/i, '')
    .trim();
  
  return {
    id: task.id,
    todoistId: task.id,
    title: displayContent,
    completed: false,
    estimatedPomodoros: estimatedPomodoros || 1,
    completedPomodoros: 0,
    createdAt: new Date().toISOString(),
    source: 'todoist'
  };
};
