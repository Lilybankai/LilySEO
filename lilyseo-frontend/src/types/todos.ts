// Todo item type
export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  status: TodoStatus;
  customStatus?: string;
  priority: TodoPriority;
  projectId: string;
  auditId?: string;
  userId: string;
  assignedTo?: string | null;
  dueDate?: Date | string | null;
  scheduledFor?: Date | string;
  timeSpent: number; // in seconds
  timeTrackedAt?: Date | string;
  aiRecommendations?: AiRecommendation[];
  createdAt: Date | string;
  updatedAt: Date | string;

  projects?: { 
    id: string;
    name: string;
  } | null;
  
  assigneeProfile?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

// Todo status enum
export type TodoStatus = 'todo' | 'in_progress' | 'review' | 'completed' | string;

// Todo priority enum
export type TodoPriority = 'low' | 'medium' | 'high' | string;

// Team member type
export interface TeamMember {
  id: string;
  teamOwnerId: string;
  userId?: string;
  email: string;
  name?: string | null;
  permissions: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  invite_token?: string | null;
  invite_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Custom kanban column/status
export interface CustomStatus {
  id: string;
  userId: string;
  name: string;
  color: string;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Todo metrics type
export interface TodoMetrics {
  id: string;
  projectId: string;
  userId: string;
  month: Date | string;
  todosCreated: number;
  todosCompleted: number;
  averageCompletionTime: number;
  totalTimeSpent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// AI recommendation for a todo
export interface AiRecommendation {
  [key: string]: any;
}

// Kanban column type
export interface KanbanColumn {
  id: string;
  title: string;
  status: TodoStatus | string;
  color: string;
  items: Todo[];
} 