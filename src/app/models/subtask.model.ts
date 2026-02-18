// Subtask interface representing a child task under a parent task
export interface Subtask {
  id: number;           // Unique identifier
  taskId: number;       // Foreign key linking to parent task
  text: string;         // Subtask description
  completed: boolean;   // Completion status
  order: number;        // Position within parent task's subtask list
  isFalling?: boolean;  // Animation flag for delete transition
  createdAt?: Date;     // Timestamp for creation (audit)
  updatedAt?: Date;     // Timestamp for last update (audit)
}
