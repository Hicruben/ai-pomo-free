# MongoDB ObjectId Casting Error

## Issue Description

The application was encountering a `CastError` when trying to use an invalid value as an ObjectId when querying the database:

```
CastError: Cast to ObjectId failed for value "[object Object]" (type string) at path "_id" for model "Task"
```

This error occurred because in some cases, an object was being passed instead of a string ID when making database queries. MongoDB requires ObjectIds to be either:
- A 24-character hex string
- A 12-byte Uint8Array
- An integer

## Root Cause

The issue was occurring in the `getTaskById` function in `taskController.js` and other similar functions. When an object was passed as an ID parameter (instead of a string), MongoDB was unable to cast it to an ObjectId.

This typically happened when:
1. An object with an `_id` property was passed directly to a function expecting just the ID string
2. The frontend was sending an object representation of a task instead of just its ID
3. The `toString()` method was being called on an object, resulting in `[object Object]` instead of the actual ID

## Solution

We implemented a robust solution with two utility functions:

1. `safeObjectId`: Safely converts any value to a valid MongoDB ObjectId string
2. `toObjectId`: Converts a value to a MongoDB ObjectId instance

These functions handle various edge cases:
- Objects with `_id` or `id` properties
- String IDs
- Already valid ObjectId instances
- Invalid values (returning null)

We then updated all controller functions that handle IDs to use these utility functions, ensuring proper ID handling throughout the application.

## Implementation Details

The utility functions are located in `server/src/utils/idUtils.js` and are used in:
- `taskController.js`
- `userController.js`
- Other controllers that handle MongoDB ObjectIds

We also updated the frontend API service to ensure it always sends string IDs rather than objects.

## Prevention

To prevent similar issues in the future:
1. Always use the utility functions when handling IDs in controllers
2. Ensure frontend code sends string IDs rather than objects
3. Add validation to API endpoints to reject invalid ID formats early

## Related Issues

This issue is related to task management and active task functionality, where task IDs are frequently passed between components and to/from the server.
