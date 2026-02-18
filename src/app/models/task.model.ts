// Task interface representing a main task item
export interface Task {
  id: number;                       // Unique identifier (timestamp + counter for uniqueness)
  text: string;                     // Task description
  completed: boolean;               // Completion status
  order: number;                    // Position in list for drag-drop reordering
  isFalling?: boolean;              // Animation flag for delete transition
  expanded?: boolean;               // Whether subtasks section is expanded/collapsed
subtaskCount?: number;              // Optional cached count for UI display
  completedSubtaskCount?: number;   // Optional cached count for UI display
}

// Filter types for task list view
export type FilterType = 'all' | 'active' | 'completed';
