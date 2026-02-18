import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { ThemeType } from '../models/themeType.model';
import { Task, FilterType } from '../models/task.model';
import { ThemeService } from '../services/theme-service';
import { TaskService } from '../services/task-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit, OnDestroy {
  newTaskText: string = '';
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentTheme: ThemeType = 'standard';
  currentFilter: FilterType = 'all';

  // Count observables
  activeCount: number = 0;
  completedCount: number = 0;
  totalCount: number = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private taskService: TaskService
  ) {}

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

    // Subscribe to all tasks for the main list (if needed)
    this.subscriptions.add(
      this.taskService.tasks$.subscribe(tasks => {
        this.tasks = tasks;
      })
    );

    // Subscribe to counts
    this.subscriptions.add(
      this.taskService.getActiveCount().subscribe(count => {
        this.activeCount = count;
      })
    );

    this.subscriptions.add(
      this.taskService.getCompletedCount().subscribe(count => {
        this.completedCount = count;
      })
    );

    this.subscriptions.add(
      this.taskService.getTotalCount().subscribe(count => {
        this.totalCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.unsubscribe();
  }

  // Add new task
  addTask(event: Event): void {
    event.preventDefault();
    this.taskService.addTask(this.newTaskText);
    this.newTaskText = '';
  }

  // Toggle task completion
  toggleComplete(taskId: number): void {
    this.taskService.toggleTaskCompletion(taskId);
  }

  // Delete task with animation
  deleteTask(taskId: number): void {
    this.taskService.deleteTask(taskId);
  }

  // Change filter
  setFilter(filter: FilterType): void {
    this.currentFilter = filter;

    // Re-subscribe to filtered tasks with new filter
    this.subscriptions.add(
      this.taskService.getFilteredTasks(filter).subscribe(tasks => {
        this.filteredTasks = tasks;
      })
    );
  }

  // Clear all completed tasks
  clearCompleted(): void {
    this.taskService.clearCompleted();
  }

  // Check if there are any completed tasks
  get hasCompletedTasks(): boolean {
    return this.completedCount > 0;
  }
}
