// Central state management service for tasks and subtasks
// Acts as the single source of truth using BehaviorSubjects
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { Subtask } from '../models/subtask.model';

@Injectable({
  providedIn: 'root', // Singleton service available app-wide
})
export class TaskStateService {
  // BehaviorSubjects hold current state and emit updates to subscribers
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private subtasksSubject = new BehaviorSubject<Subtask[]>([]);

  // Public observables - components subscribe to these for real-time updates
  tasks$ = this.tasksSubject.asObservable();
  subtasks$ = this.subtasksSubject.asObservable();

  // Synchronous getters for current values (useful in services)
  get currentTasks(): Task[] {
    return this.tasksSubject.getValue();
  }

  get currentSubtasks(): Subtask[] {
    return this.subtasksSubject.getValue();
  }

  // Update methods - call these to modify state (triggers all subscribers)
  updateTasks(tasks: Task[]): void {
    this.tasksSubject.next(tasks); // Emit new task array to all subscribers
  }

  updateSubtasks(subtasks: Subtask[]): void {
    this.subtasksSubject.next(subtasks); // Emit new subtask array
  }

  // Shared logic - Task related queries
  taskHasSubtasks(taskId: number): boolean {
    return this.currentSubtasks.some(s => s.taskId === taskId);
  }

  getSubtasksForTask(taskId: number): Subtask[] {
    return this.currentSubtasks
      .filter(s => s.taskId === taskId)
      .sort((a, b) => a.order - b.order); // Sort by order for consistent display
  }

  getSubtaskCount(taskId: number): number {
    return this.currentSubtasks.filter(s => s.taskId === taskId).length;
  }

  getCompletedSubtaskCount(taskId: number): number {
    return this.currentSubtasks.filter(s => s.taskId === taskId && s.completed).length;
  }

  getTaskCompletionPercentage(taskId: number): number {
    const subtasks = this.getSubtasksForTask(taskId);
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  // Check if all subtasks for a task are completed
  areAllSubtasksCompleted(taskId: number): boolean {
    const subtasks = this.getSubtasksForTask(taskId);
    return subtasks.length > 0 && subtasks.every(s => s.completed);
  }

  // Persistence methods - sync with localStorage
  saveTasksToStorage(tasks: Task[]): void {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    this.updateTasks(tasks); // Update subjects after storage
  }

  saveSubtasksToStorage(subtasks: Subtask[]): void {
    localStorage.setItem('subtasks', JSON.stringify(subtasks));
    this.updateSubtasks(subtasks);
  }

  // Load methods - retrieve from localStorage
  loadTasksFromStorage(): Task[] {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  }

  loadSubtasksFromStorage(): Subtask[] {
    const savedSubtasks = localStorage.getItem('subtasks');
    return savedSubtasks ? JSON.parse(savedSubtasks) : [];
  }
}
