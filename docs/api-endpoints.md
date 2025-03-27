# API Endpoints Documentation

## Todo Status Updates

### Update Todo Status
`PATCH /api/todos/status`

Updates the status of a todo item and sends notifications to relevant team members.

#### Request Body
```json
{
  "todoId": "string",
  "status": "string",
  "timeSpent": "number" // optional, in minutes
}
```

#### Status Values
- `todo` - Task is in the backlog
- `in_progress` - Task is being worked on
- `review` - Task is ready for review
- `completed` - Task is finished

#### Response
```json
{
  "success": true,
  "todo": {
    "id": "string",
    "title": "string",
    "status": "string",
    "updated_at": "string",
    "completion_date": "string", // only if status is 'completed'
    "time_spent": "number",
    // ... other todo fields
  }
}
```

#### Notifications
- Owner is notified when status changes (if not the one updating)
- Assignee is notified when status changes (if not the one updating)
- Notifications include previous and new status

#### Permissions
- Todo owner can update status
- Assigned team member can update status
- Admin team members can update status

---

## Task Reassignment

### Reassign Todo
`POST /api/todos/reassign`

Reassigns a todo to a different team member and sends notifications to all parties.

#### Request Body
```json
{
  "todoId": "string",
  "assigneeId": "string"
}
```

#### Response
```json
{
  "success": true,
  "todo": {
    "id": "string",
    "title": "string",
    "assigned_to": "string",
    "updated_at": "string",
    // ... other todo fields
  }
}
```

#### Notifications
- New assignee receives notification
- Previous assignee receives notification (if exists)
- Todo owner receives notification (if not the one reassigning)

#### Permissions
- Todo owner can reassign
- Admin team members can reassign
- Regular team members cannot reassign unless they are the owner

---

## Batch Operations

### Batch Status Update
`POST /api/todos/batch/status`

Updates the status of multiple todo items at once and sends aggregated notifications.

#### Request Body
```json
{
  "todoIds": ["string", "string", ...],
  "status": "string",
  "timeSpent": "number" // optional, in minutes
}
```

#### Response
```json
{
  "success": true,
  "updated": 5, // number of successfully updated todos
  "todos": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "updated_at": "string",
      // ... other todo fields
    }
  ],
  "unauthorized": ["string", "string"], // IDs of todos the user cannot update
  "failed": 0 // number of todos that failed to update for other reasons
}
```

#### Notifications
- Owner gets a notification for each todo they don't own
- Assignees get notifications for their assigned todos
- A summary notification is sent for batch operations

#### Permissions
- Same as individual status updates
- Permissions are checked per todo
- The operation continues for todos the user has permission to update

### Batch Assignment
`POST /api/todos/batch/assign`

Assigns multiple todos to a team member at once.

#### Request Body
```json
{
  "todoIds": ["string", "string", ...],
  "assigneeId": "string"
}
```

#### Response
```json
{
  "success": true,
  "updated": 5, // number of successfully assigned todos
  "todos": [
    {
      "id": "string",
      "title": "string", 
      "assigned_to": "string",
      "updated_at": "string",
      // ... other todo fields
    }
  ],
  "unauthorized": ["string", "string"], // IDs of todos the user cannot assign
  "failed": 0 // number of todos that failed to assign for other reasons
}
```

#### Notifications
- New assignee receives a notification for each todo
- Previous assignees receive notifications
- Todo owners receive notifications
- A summary notification is sent for batch operations

#### Permissions
- Same as individual assignments
- Assignee must be a member of the team for each todo
- Permissions are checked per todo
- The operation continues for todos the user has permission to assign

### Batch Delete
`POST /api/todos/batch/delete`

Deletes multiple todos at once.

#### Request Body
```json
{
  "todoIds": ["string", "string", ...]
}
```

#### Response
```json
{
  "success": true,
  "deleted": 5, // number of successfully deleted todos
  "unauthorized": ["string", "string"], // IDs of todos the user cannot delete
  "failed": 0 // number of todos that failed to delete for other reasons
}
```

#### Permissions
- Todo owner can delete
- Admin team members can delete
- The operation continues for todos the user has permission to delete

---

## Client-Side Services

### Todo Status Service
The `todo-status.ts` service provides the following functions:

```typescript
// Update todo status
updateTodoStatus(todoId: string, status: string, timeSpent?: number): Promise<Result>

// Reassign todo
reassignTodo(todoId: string, assigneeId: string): Promise<Result>

// Helper functions
completeTodo(todoId: string, timeSpent?: number): Promise<Result>
startTodo(todoId: string): Promise<Result>
resetTodo(todoId: string): Promise<Result>
logTimeSpent(todoId: string, timeSpent: number): Promise<Result>
```

### Batch Operations Service
The `todo-batch.ts` service provides the following functions:

```typescript
// Batch update status
updateTodosStatus(todoIds: string[], status: string, timeSpent?: number): Promise<Result>

// Batch assign todos
assignTodos(todoIds: string[], assigneeId: string): Promise<Result>

// Batch delete todos
deleteTodos(todoIds: string[]): Promise<Result>

// Helper functions
completeTodos(todoIds: string[], timeSpent?: number): Promise<Result>
startTodos(todoIds: string[]): Promise<Result>
resetTodos(todoIds: string[]): Promise<Result>
```

### Usage Example
```typescript
import { updateTodoStatus, reassignTodo } from '@/services/todo-status';
import { updateTodosStatus, assignTodos } from '@/services/todo-batch';

// Update status of a single todo
const result = await updateTodoStatus('todo-123', 'completed', 30);
if (result.success) {
  // Status updated successfully
}

// Update status of multiple todos
const batchResult = await updateTodosStatus(['todo-123', 'todo-456'], 'completed', 30);
if (batchResult.success) {
  // Statuses updated successfully
  console.log(`Updated ${batchResult.updated} todos`);
  if (batchResult.unauthorized?.length > 0) {
    console.log(`Unauthorized to update ${batchResult.unauthorized.length} todos`);
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400 // HTTP status code
}
```

Common error scenarios:
- 401: Unauthorized - User not authenticated
- 403: Forbidden - User lacks permission
- 404: Not Found - Todo or assignee not found
- 400: Bad Request - Invalid status or missing fields
- 500: Internal Server Error - Server-side error

## Rate Limiting

- Status updates: 60 requests per minute per user
- Reassignments: 30 requests per minute per user
- Batch operations: 20 requests per minute per user
- Notifications: 100 per minute per user

## Best Practices

1. Always check the response `success` field
2. Handle errors gracefully with user-friendly messages
3. Implement optimistic updates for better UX
4. Use the provided helper functions when possible
5. Consider debouncing frequent status updates
6. Cache team member data to reduce API calls
7. Implement retry logic for failed requests
8. For batch operations, keep the batch size reasonable (under 50 items)
9. Check for partial failures in batch operation responses
10. Handle unauthorized items appropriately in the UI 