import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Task, FilterType } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private tasksSubject: BehaviorSubject<Task[]>;
  public tasks$: Observable<Task[]>;
  private nextId: number = 0;

  constructor() {
    // Initialize tasks from localStorage
    const savedTasks = this.loadTasksFromStorage();

    // Ensure all tasks have an order property (for backward compatibility)
    const tasksWithOrder = savedTasks.map((task, index) => ({
      ...task,
      order: task.order !== undefined ? task.order : index
    }));

    this.tasksSubject = new BehaviorSubject<Task[]>(tasksWithOrder);
    this.tasks$ = this.tasksSubject.asObservable();

    // Set nextId based on existing tasks
    this.updateNextId();
  }

  // Get current tasks value synchronously
  get currentTasks(): Task[] {
    return this.tasksSubject.getValue();
  }

  // Get tasks sorted by order
  private getSortedTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => a.order - b.order);
  }

  // Get filtered tasks as observable (sorted by order)
  getFilteredTasks(filter: FilterType): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => {
        const filtered = this.getSortedTasks(tasks);
        switch (filter) {
          case 'active':
            return filtered.filter(task => !task.completed);
          case 'completed':
            return filtered.filter(task => task.completed);
          default:
            return filtered;
        }
      })
    );
  }

  // Get count of active tasks
  getActiveCount(): Observable<number> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => !task.completed).length)
    );
  }

  // Get count of completed tasks
  getCompletedCount(): Observable<number> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.completed).length)
    );
  }

  // Get total task count
  getTotalCount(): Observable<number> {
    return this.tasks$.pipe(
      map(tasks => tasks.length)
    );
  }

  // Add new task (adds to the end)
  addTask(text: string): void {
    if (!text.trim()) return;

    const currentTasks = this.currentTasks;
    const maxOrder = currentTasks.length > 0
      ? Math.max(...currentTasks.map(t => t.order))
      : -1;

    const newTask: Task = {
      id: this.nextId++,
      text: text.trim(),
      completed: false,
      order: maxOrder + 1
    };

    const updatedTasks = [...currentTasks, newTask];
    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
  }

  // Reorder tasks after drag and drop
  reorderTasks(previousIndex: number, currentIndex: number): void {
    const currentTasks = this.currentTasks;
    const sortedTasks = this.getSortedTasks(currentTasks);

    // Remove the task from its old position
    const [movedTask] = sortedTasks.splice(previousIndex, 1);

    // Insert it at the new position
    sortedTasks.splice(currentIndex, 0, movedTask);

    // Update order values based on new positions
    const updatedTasks = sortedTasks.map((task, index) => ({
      ...task,
      order: index
    }));

    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
  }

  // Toggle task completion
  toggleTaskCompletion(taskId: number): void {
    const currentTasks = this.currentTasks;
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
  }

  // Delete task with animation support
  deleteTask(taskId: number): void {
    const currentTasks = this.currentTasks;

    // First, mark task as falling for animation
    const tasksWithFalling = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, isFalling: true }
        : task
    );
    this.tasksSubject.next(tasksWithFalling);

    // Actually remove after animation delay
    setTimeout(() => {
      const updatedTasks = this.currentTasks
        .filter(task => task.id !== taskId)
        .map((task, index) => ({ ...task, order: index })); // Reorder after deletion

      this.tasksSubject.next(updatedTasks);
      this.saveTasksToStorage(updatedTasks);
      this.updateNextId();
    }, 500);
  }

  // Update task text
  updateTask(taskId: number, newText: string): void {
    if (!newText.trim()) return;

    const currentTasks = this.currentTasks;
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, text: newText.trim() }
        : task
    );

    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
  }

  // Clear all completed tasks
  clearCompleted(): void {
    const currentTasks = this.currentTasks;
    const incompleteTasks = currentTasks.filter(task => !task.completed);

    // Reorder remaining tasks
    const updatedTasks = incompleteTasks.map((task, index) => ({
      ...task,
      order: index
    }));

    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
    this.updateNextId();
  }

  // Check if a task exists
  taskExists(taskId: number): boolean {
    return this.currentTasks.some(task => task.id === taskId);
  }

  // Get a single task by id
  getTaskById(taskId: number): Task | undefined {
    return this.currentTasks.find(task => task.id === taskId);
  }

  // Private method to save tasks to localStorage
  private saveTasksToStorage(tasks: Task[]): void {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Private method to load tasks from localStorage
  private loadTasksFromStorage(): Task[] {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  }

  // Private method to update nextId based on current tasks
  private updateNextId(): void {
    const tasks = this.currentTasks;
    this.nextId = tasks.length > 0
      ? Math.max(...tasks.map(t => t.id)) + 1
      : 0;
  }
}
