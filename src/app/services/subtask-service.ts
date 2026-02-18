// Business logic service for subtask operations
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Subtask } from '../models/subtask.model';
import { TaskStateService } from './task-state-service';
import { TaskService } from './task-service';

@Injectable({
  providedIn: 'root',
})
export class SubtaskService {
  private nextId: number = 0;

  constructor(
    private stateService: TaskStateService,
    private taskService: TaskService
  ) {
    // Initialize from stored data
    const savedSubtasks = this.stateService.loadSubtasksFromStorage();

    const subtasksWithOrder = savedSubtasks.map((subtask, index) => ({
      ...subtask,
      order: subtask.order !== undefined ? subtask.order : index
    }));

    this.stateService.saveSubtasksToStorage(subtasksWithOrder);
    this.updateNextId();
  }

  // Public observables
  get subtasks$(): Observable<Subtask[]> {
    return this.stateService.subtasks$;
  }

  get currentSubtasks(): Subtask[] {
    return this.stateService.currentSubtasks;
  }

  // Query methods
  getSubtasksByTaskId(taskId: number): Observable<Subtask[]> {
    return this.stateService.subtasks$.pipe(
      map(subtasks => subtasks
        .filter(s => s.taskId === taskId)
        .sort((a, b) => a.order - b.order) // Maintain order within task
      )
    );
  }

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
    return this.getSubtasksByTaskId(taskId).pipe(
      map(subtasks => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.completed).length;
        return Math.round((completed / subtasks.length) * 100);
      })
    );
  }

  taskHasSubtasks(taskId: number): boolean {
    return this.stateService.taskHasSubtasks(taskId);
  }

  // CRUD Operations

  // Create new subtask
  addSubtask(taskId: number, text: string): void {
    if (!text.trim()) return;

    const taskSubtasks = this.currentSubtasks.filter(s => s.taskId === taskId);
    const maxOrder = taskSubtasks.length > 0
      ? Math.max(...taskSubtasks.map(s => s.order))
      : -1;

    const newSubtask: Subtask = {
      id: this.nextId++,
      taskId: taskId,
      text: text.trim(),
      completed: false,
      order: maxOrder + 1, // New subtasks go to the end
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSubtasks = [...this.currentSubtasks, newSubtask];
    this.stateService.saveSubtasksToStorage(updatedSubtasks);

    // Check if parent task should be auto-completed
    this.updateParentTaskCompletion(taskId);
  }

  // Toggle completion status
  toggleSubtaskCompletion(subtaskId: number, taskId: number): void {
    const updatedSubtasks = this.currentSubtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
        : subtask
    );

    this.stateService.saveSubtasksToStorage(updatedSubtasks);
    this.updateParentTaskCompletion(taskId);
  }

  // Delete with animation
  deleteSubtask(subtaskId: number, taskId: number): void {
    // Step 1: Mark as falling for animation
    const withFalling = this.currentSubtasks.map(s =>
      s.id === subtaskId ? { ...s, isFalling: true } : s
    );
    this.stateService.saveSubtasksToStorage(withFalling);

    // Step 2: Actually remove after animation
    setTimeout(() => {
      const remainingSubtasks = this.currentSubtasks
        .filter(s => s.id !== subtaskId)
        .map((s, index) => ({ ...s, order: index })); // Reorder remaining

      this.stateService.saveSubtasksToStorage(remainingSubtasks);
      this.updateNextId();
      this.updateParentTaskCompletion(taskId);

      // Force update to ensure subscribers get new data
      this.stateService.updateSubtasks([...this.currentSubtasks]);
    }, 500);
  }

  // Reorder subtasks within a task
  reorderSubtasks(taskId: number, previousIndex: number, currentIndex: number): void {
    const taskSubtasks = this.currentSubtasks
      .filter(s => s.taskId === taskId)
      .sort((a, b) => a.order - b.order);

    const [movedSubtask] = taskSubtasks.splice(previousIndex, 1);
    taskSubtasks.splice(currentIndex, 0, movedSubtask);

    const updatedTaskSubtasks = taskSubtasks.map((subtask, index) => ({
      ...subtask,
      order: index,
      updatedAt: new Date()
    }));

    const otherSubtasks = this.currentSubtasks.filter(s => s.taskId !== taskId);
    const updatedSubtasks = [...otherSubtasks, ...updatedTaskSubtasks];

    this.stateService.saveSubtasksToStorage(updatedSubtasks);
  }

  // Bulk operations
  deleteSubtasksByTaskId(taskId: number): void {
    const updatedSubtasks = this.currentSubtasks.filter(s => s.taskId !== taskId);
    this.stateService.saveSubtasksToStorage(updatedSubtasks);
    this.updateNextId();
  }

  clearCompletedSubtasks(taskId: number): void {
    const taskSubtasks = this.currentSubtasks.filter(s => s.taskId === taskId);
    const incompleteSubtasks = taskSubtasks.filter(s => !s.completed);
    const otherSubtasks = this.currentSubtasks.filter(s => s.taskId !== taskId);

    const reorderedIncomplete = incompleteSubtasks.map((subtask, index) => ({
      ...subtask,
      order: index,
      updatedAt: new Date()
    }));

    const updatedSubtasks = [...otherSubtasks, ...reorderedIncomplete];
    this.stateService.saveSubtasksToStorage(updatedSubtasks);
    this.updateParentTaskCompletion(taskId);
  }

  // Private helper to manage parent task completion
  private updateParentTaskCompletion(taskId: number): void {
    const allCompleted = this.stateService.areAllSubtasksCompleted(taskId);
    const task = this.taskService.getTaskById(taskId);

    // Auto-toggle parent task completion based on subtasks
    if (task && task.completed !== allCompleted) {
      this.taskService.toggleTaskCompletion(taskId);
    }
  }

  private updateNextId(): void {
    const subtasks = this.currentSubtasks;
    this.nextId = subtasks.length > 0
      ? Math.max(...subtasks.map(s => s.id)) + 1
      : 0;
  }
}
