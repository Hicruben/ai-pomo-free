/**
 * Utility to clear localStorage timer state
 * 
 * This utility provides functions to clear localStorage timer state
 * to ensure the application always uses the database for timer state.
 */

/**
 * Clear all timer-related localStorage items
 */
export const clearTimerLocalStorage = () => {
  console.log('[clearLocalStorage] Clearing timer-related localStorage items');
  
  // Remove timer state
  localStorage.removeItem('pomodoroTimerState');
  
  // Log the result
  console.log('[clearLocalStorage] Timer state cleared from localStorage');
  
  return true;
};

/**
 * Clear all localStorage items (for testing/debugging)
 */
export const clearAllLocalStorage = () => {
  console.log('[clearLocalStorage] Clearing all localStorage items');
  
  // Clear all localStorage
  localStorage.clear();
  
  // Log the result
  console.log('[clearLocalStorage] All localStorage items cleared');
  
  return true;
};
