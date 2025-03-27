// Todo item type
export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  customStatus?: string;
  priority: TodoPriority;
  projectId: string;
  auditId?: string;
  userId: string;
  assignedTo?: string;
  dueDate?: Date | string;
  scheduledFor?: Date | string;
  timeSpent: number; // in seconds
  timeTrackedAt?: Date | string;
  aiRecommendations?: AiRecommendation[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Todo status enum
export type TodoStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';

// Todo priority enum
export type TodoPriority = 'low' | 'medium' | 'high' | 'critical';

// Team member type
export interface TeamMember {
  id: string;
  teamOwnerId: string;
  userId: string;
  email: string;
  name: string;
  permissions: TeamMemberPermission;
  status: TeamMemberStatus;
  inviteToken?: string;
  inviteExpiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Team member permission enum
export type TeamMemberPermission = 'admin' | 'member' | 'viewer';

// Team member status enum
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';

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
  id: string;
  type: string; // 'title', 'description', 'meta', etc.
  originalValue: string;
  recommendedValue: string;
  reasonForRecommendation: string;
  applied: boolean;
  appliedAt?: Date | string;
}

// Kanban column type
export interface KanbanColumn {
  id: string;
  title: string;
  status: TodoStatus | string;
  color: string;
  items: Todo[];
} 