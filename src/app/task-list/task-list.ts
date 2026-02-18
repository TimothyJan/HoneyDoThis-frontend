import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeType } from '../models/themeType.model';
import { Task, FilterType } from '../models/task.model';
import { ThemeService } from '../services/theme-service';
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

  private themeSubscription: Subscription;
  private nextId: number = 0;

  constructor(private themeService: ThemeService) {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit(): void {
    this.loadTasks();
    this.updateFilteredTasks();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // Add new task
  addTask(event: Event): void {
    event.preventDefault();

    const taskText = this.newTaskText.trim();
    if (taskText === '') {
      alert('You must write something!');
      return;
    }

    const taskObject: Task = {
      id: this.nextId++,
      text: taskText,
      completed: false
    };
    this.tasks.push(taskObject);
    this.saveTasksToLocalStorage();
    this.updateFilteredTasks();

    this.newTaskText = '';
  }

  // Toggle task completion
  toggleComplete(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasksToLocalStorage();
      this.updateFilteredTasks();
    }
  }

  // Delete task with animation
  deleteTask(taskId: number): void {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      // Add falling animation class
      this.tasks[index].isFalling = true;

      // Remove after animation
      setTimeout(() => {
        this.tasks.splice(index, 1);
        this.saveTasksToLocalStorage();
        this.updateFilteredTasks();
      }, 500);
    }
  }

  // Change filter
  setFilter(filter: FilterType): void {
    this.currentFilter = filter;
    this.updateFilteredTasks();
  }

  // Update filtered tasks based on current filter
  private updateFilteredTasks(): void {
    switch (this.currentFilter) {
      case 'active':
        this.filteredTasks = this.tasks.filter(task => !task.completed);
        break;
      case 'completed':
        this.filteredTasks = this.tasks.filter(task => task.completed);
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
  }

  // Get count of active tasks
  getActiveCount(): number {
    return this.tasks.filter(task => !task.completed).length;
  }

  // Get count of completed tasks
  getCompletedCount(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  // Save tasks to localStorage
  private saveTasksToLocalStorage(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    // Update nextId to be one more than the max id
    this.nextId = this.tasks.length > 0
      ? Math.max(...this.tasks.map(t => t.id)) + 1
      : 0;
  }

  // Load tasks from localStorage
  private loadTasks(): void {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks);
      this.nextId = this.tasks.length > 0
        ? Math.max(...this.tasks.map(t => t.id)) + 1
        : 0;
      this.updateFilteredTasks();
    }
  }
}
