# Issue: Confirmation Dialog Appears Twice When Switching Active Tasks

## Description

When a user attempts to switch active tasks while a Pomodoro timer is running, a confirmation dialog should appear to warn the user that their timer progress will be lost. However, there is a bug where the confirmation dialog appears twice - once after clicking the "Set Active" button, and again after clicking the "Confirm" button on the first dialog.

## Steps to Reproduce

1. Start a Pomodoro timer for any task
2. While the timer is running, attempt to set another task as active by clicking the "Set Active" button
3. A confirmation dialog appears asking if you want to reset the timer
4. Click "Confirm" or "Switch Task" on the dialog
5. Instead of switching the task immediately, a second identical confirmation dialog appears

## Expected Behavior

The confirmation dialog should appear only once. After clicking "Confirm" or "Switch Task", the application should immediately switch the active task and reset the timer without showing a second dialog.

## Current Behavior

The confirmation dialog appears twice in succession, requiring the user to confirm the same action twice.

## Attempted Solutions

Several approaches have been tried to fix this issue:

1. **Custom Confirmation Dialog Component**: 
   - Implemented a custom ConfirmationDialog component with state management
   - Added flags to prevent multiple confirmations
   - Used setTimeout to delay actions after dialog closure

2. **Browser's Built-in Confirm Dialog**:
   - Replaced the custom dialog with window.confirm()
   - Added isConfirming state flags to prevent multiple confirmations
   - Implemented try-finally blocks to ensure flags are reset

3. **Event Handling Improvements**:
   - Modified event handlers to prevent event propagation
   - Added guards to prevent multiple dialog triggers

Despite these attempts, the issue persists. The dialog still appears twice in some scenarios.

## Possible Root Causes

1. **Event Bubbling**: The click event might be bubbling up and triggering multiple handlers.
2. **State Updates**: React's state updates might be causing multiple renders that trigger the confirmation logic.
3. **Multiple Component Communication**: The task switching logic spans multiple components (TaskList, ProjectDetail, AppWithAuth), and they might be triggering confirmations independently.
4. **Asynchronous Operations**: The timer state checking and task switching involve asynchronous operations that might be causing race conditions.

## Impact

This issue affects user experience by:
- Requiring users to confirm the same action twice
- Creating confusion about whether the action was successful
- Potentially causing users to abandon task switching due to frustration

## Priority

Medium - The application is still functional, but this issue creates a poor user experience.

## Suggested Next Steps

1. Implement a global state management solution (like Redux) to centralize the confirmation logic
2. Add comprehensive logging to trace the exact sequence of events
3. Consider refactoring the task switching logic to use a more centralized approach
4. Investigate if there are any React event handling patterns that could prevent the double triggering
