// Business logic service for task operations
// Depends on TaskStateService for data management
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Task, FilterType } from '../models/task.model';
import { TaskStateService } from './task-state-service';
import { Subtask } from '../models/subtask.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private nextId: number = 0; // For generating unique task IDs

  constructor(private stateService: TaskStateService) {
    // Initialize from stored data on service creation
    const savedTasks = this.stateService.loadTasksFromStorage();

    // Ensure all tasks have required properties (for backward compatibility)
    const tasksWithOrder = savedTasks.map((task, index) => ({
      ...task,
      order: task.order !== undefined ? task.order : index,
      expanded: task.expanded !== undefined ? task.expanded : false
    }));

    this.stateService.saveTasksToStorage(tasksWithOrder);
    this.updateNextId();
  }

  // Public observables - expose state service data with transformations
  get tasks$(): Observable<Task[]> {
    return this.stateService.tasks$;
  }

  // Synchronous accessors for current state
  get currentTasks(): Task[] {
    return this.stateService.currentTasks;
  }

  // Filter tasks based on completion status
  getFilteredTasks(filter: FilterType): Observable<Task[]> {
    return this.stateService.tasks$.pipe(
      map(tasks => {
        const sorted = [...tasks].sort((a, b) => a.order - b.order); // Maintain order
        switch (filter) {
          case 'active':
            return sorted.filter(task => !task.completed);
          case 'completed':
            return sorted.filter(task => task.completed);
          default:
            return sorted; // 'all' filter
        }
      })
    );
  }

  // Count observables - derived data for UI
  getActiveCount(): Observable<number> {
    return this.stateService.tasks$.pipe(
      map(tasks => tasks.filter(task => !task.completed).length)
    );
  }

  getCompletedCount(): Observable<number> {
    return this.stateService.tasks$.pipe(
      map(tasks => tasks.filter(task => task.completed).length)
    );
  }

  getTotalCount(): Observable<number> {
    return this.stateService.tasks$.pipe(
      map(tasks => tasks.length)
    );
  }

  // CRUD Operations

  // Create new task
  addTask(text: string): void {
    if (!text.trim()) return;

    const currentTasks = this.currentTasks;
    const maxOrder = currentTasks.length > 0
      ? Math.max(...currentTasks.map(t => t.order))
      : -1;

    // Use timestamp + counter to ensure unique IDs (prevents conflicts with deleted tasks)
    const newTask: Task = {
      id: Date.now() + this.nextId++,
      text: text.trim(),
      completed: false,
      order: maxOrder + 1, // New tasks go to the end
      expanded: false      // Start collapsed
    };

    const updatedTasks = [...currentTasks, newTask];
    this.stateService.saveTasksToStorage(updatedTasks);
  }

  // Toggle completion status
  toggleTaskCompletion(taskId: number): void {
    const currentTasks = this.currentTasks;
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    this.stateService.saveTasksToStorage(updatedTasks);
  }

  // Toggle subtask section expansion
  toggleTaskExpansion(taskId: number): void {
    const currentTasks = this.currentTasks;
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId
        ? { ...task, expanded: !task.expanded }
        : task
    );

    this.stateService.saveTasksToStorage(updatedTasks);
  }

  // Delete task with animation support
  deleteTask(taskId: number): void {
    const currentTasks = this.currentTasks;

    // Step 1: Mark task as falling (triggers CSS animation)
    const tasksWithFalling = currentTasks.map(task =>
      task.id === taskId ? { ...task, isFalling: true } : task
    );
    this.stateService.saveTasksToStorage(tasksWithFalling);

    // Step 2: Actually remove after animation completes
    setTimeout(() => {
      const updatedTasks = this.currentTasks
        .filter(task => task.id !== taskId)  // Remove the falling task
        .map((task, index) => ({ ...task, order: index })); // Reorder remaining tasks

      this.stateService.saveTasksToStorage(updatedTasks);
      this.updateNextId();

      // Force update to ensure all subscribers get the new data
      this.stateService.updateTasks([...updatedTasks]);
    }, 500); // Match CSS animation duration
  }

  // Reorder tasks after drag and drop
  reorderTasks(previousIndex: number, currentIndex: number): void {
    const sortedTasks = [...this.currentTasks].sort((a, b) => a.order - b.order);
    const [movedTask] = sortedTasks.splice(previousIndex, 1);
    sortedTasks.splice(currentIndex, 0, movedTask);

    // Update order values based on new positions
    const updatedTasks = sortedTasks.map((task, index) => ({
      ...task,
      order: index
    }));

    this.stateService.saveTasksToStorage(updatedTasks);
  }

  // Remove all completed tasks
  clearCompleted(): void {
    const incompleteTasks = this.currentTasks.filter(task => !task.completed);
    const updatedTasks = incompleteTasks.map((task, index) => ({
      ...task,
      order: index,
      expanded: false // Collapse all after clear
    }));

    this.stateService.saveTasksToStorage(updatedTasks);
    this.updateNextId();
  }

  // Query methods using state service
  taskHasSubtasks(taskId: number): boolean {
    return this.stateService.taskHasSubtasks(taskId);
  }

  getTaskById(taskId: number): Task | undefined {
    return this.currentTasks.find(task => task.id === taskId);
  }

  taskExists(taskId: number): boolean {
    return this.currentTasks.some(task => task.id === taskId);
  }

  // Subtask-related queries (delegating to state service)
  getSubtaskCount(taskId: number): Observable<number> {
    return this.stateService.subtasks$.pipe(
      map(subtasks => subtasks.filter(s => s.taskId === taskId).length)
    );
  }

  getCompletedSubtaskCount(taskId: number): Observable<number> {
    return this.stateService.subtasks$.pipe(
      map(subtasks => subtasks.filter(s => s.taskId === taskId && s.completed).length)
    );
  }

  getTaskCompletionPercentage(taskId: number): Observable<number> {
    return this.stateService.subtasks$.pipe(
      map(subtasks => {
        const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
        if (taskSubtasks.length === 0) return 0;
        const completed = taskSubtasks.filter(s => s.completed).length;
        return Math.round((completed / taskSubtasks.length) * 100);
      })
    );
  }

  // Synchronous version for template conditionals
  hasSubtasks(taskId: number): boolean {
    return this.stateService.taskHasSubtasks(taskId);
  }

  // Get full subtask list for a task (for advanced features)
  getSubtasksForTask(taskId: number): Observable<Subtask[]> {
    return this.stateService.subtasks$.pipe(
      map(subtasks => subtasks
        .filter(s => s.taskId === taskId)
        .sort((a, b) => a.order - b.order)
      )
    );
  }

  // Private helper to maintain unique IDs
  private updateNextId(): void {
    const tasks = this.currentTasks;
    // Add buffer to avoid conflicts with deleted task IDs
    this.nextId = tasks.length > 0
      ? Math.max(...tasks.map(t => t.id)) + 1000
      : Date.now(); // Start with timestamp if no tasks
  }
}
