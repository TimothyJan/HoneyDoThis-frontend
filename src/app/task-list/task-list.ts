// Main task list component - displays tasks with filtering, drag-drop, and subtasks
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ThemeType } from '../models/themeType.model';
import { Task, FilterType } from '../models/task.model';
import { ThemeService } from '../services/theme-service';
import { TaskService } from '../services/task-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubtaskList } from "../subtask-list/subtask-list";
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    SubtaskList
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit, OnDestroy {
  // Form input
  newTaskText: string = '';

  // Data arrays
  tasks: Task[] = [];           // All tasks
  filteredTasks: Task[] = [];    // Tasks after applying current filter

  // UI state
  currentTheme: ThemeType = 'standard';
  currentFilter: FilterType = 'all';

  // Observables for reactive count display (using async pipe in template)
  activeCount$: Observable<number>;
  completedCount$: Observable<number>;
  totalCount$: Observable<number>;
  hasCompletedTasks$: Observable<boolean>; // Derived observable for clear button

  // Computed property - disable drag when not viewing all tasks
  get dragDisabled(): boolean {
    return this.currentFilter !== 'all';
  }

  // Subscription management to prevent memory leaks
  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private taskService: TaskService
  ) {
    // Initialize observables in constructor
    this.activeCount$ = this.taskService.getActiveCount();
    this.completedCount$ = this.taskService.getCompletedCount();
    this.totalCount$ = this.taskService.getTotalCount();

    // Derived observable - true when there are completed tasks
    this.hasCompletedTasks$ = this.completedCount$.pipe(
      map(count => count > 0)
    );
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme = theme;
      })
    );

    // Subscribe to filtered tasks based on current filter
    this.subscriptions.add(
      this.taskService.getFilteredTasks(this.currentFilter).subscribe(tasks => {
        this.filteredTasks = tasks;
      })
    );

    // Subscribe to all tasks for reference (used in hasSubtasks checks)
    this.subscriptions.add(
      this.taskService.tasks$.subscribe(tasks => {
        this.tasks = tasks;
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions when component is destroyed
    this.subscriptions.unsubscribe();
  }

  // Create new task
  addTask(event: Event): void {
    event.preventDefault(); // Prevent form submission
    this.taskService.addTask(this.newTaskText);
    this.newTaskText = ''; // Clear input
  }

  // Toggle task completion
  toggleComplete(taskId: number): void {
    this.taskService.toggleTaskCompletion(taskId);
  }

  // Delete task (animation handled in service)
  deleteTask(taskId: number): void {
    this.taskService.deleteTask(taskId);
  }

  // Handle drag and drop reordering
  drop(event: CdkDragDrop<Task[]>): void {
    if (this.dragDisabled) return; // Can't reorder when filtered
    this.taskService.reorderTasks(event.previousIndex, event.currentIndex);
  }

  // Change active filter
  setFilter(filter: FilterType): void {
    this.currentFilter = filter;

    // Resubscribe to filtered tasks with new filter
    this.subscriptions.add(
      this.taskService.getFilteredTasks(filter).subscribe(tasks => {
        this.filteredTasks = tasks;
      })
    );
  }

  // Remove all completed tasks
  clearCompleted(): void {
    this.taskService.clearCompleted();
  }

  // Legacy method - kept for compatibility, but not used (using async pipe instead)
  get hasCompletedTasks(): boolean {
    return false; // Handled by async pipe in template
  }

  // Subtask-related methods
  addSubtaskToTask(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.expanded) {
      this.toggleTaskExpanded(taskId); // Expand to show subtask form
    }
  }

  hasSubtasks(taskId: number): boolean {
    return this.taskService.taskHasSubtasks(taskId);
  }

  getSubtaskCount(taskId: number): Observable<number> {
    return this.taskService.getSubtaskCount(taskId);
  }

  toggleTaskExpanded(taskId: number): void {
    this.taskService.toggleTaskExpansion(taskId);
  }
}
