export interface Task {
  id: number;
  text: string;
  completed: boolean;
  order: number;  // Add this field for drag reordering
  isFalling?: boolean;
}

export type FilterType = 'all' | 'active' | 'completed';
