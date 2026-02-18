export interface Task {
  id: number;
  text: string;
  completed: boolean;
  isFalling?: boolean;
}

export type FilterType = 'all' | 'active' | 'completed';
