import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeType } from '../models/themeType.model';
import { ThemeService } from '../services/theme-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit, OnDestroy {
  newTodoText: string = '';
  todos: Task[] = [];
  currentTheme: ThemeType = 'standard';
  currentDateTime: string = '';

  private themeSubscription: Subscription;
  private dateTimeInterval: any;

  constructor(private themeService: ThemeService) {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit(): void {
    this.loadTodos();
    this.updateDateTime();
    // Update date time every second
    this.dateTimeInterval = setInterval(() => this.updateDateTime(), 1000);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and intervals
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.dateTimeInterval) {
      clearInterval(this.dateTimeInterval);
    }
  }

  // Update date time display
  updateDateTime(): void {
    this.currentDateTime = new Date().toLocaleString();
  }

  // Add new todo
  addToDo(event: Event): void {
    event.preventDefault();

    const todoText = this.newTodoText.trim();
    if (todoText === '') {
      alert('You must write something!');
      return;
    }

    const todoObject: Task = { text: todoText, completed: false };
    this.todos.push(todoObject);
    this.saveTodosToLocalStorage();

    this.newTodoText = '';
  }

  // Toggle todo completion
  toggleComplete(index: number): void {
    this.todos[index].completed = !this.todos[index].completed;
    this.saveTodosToLocalStorage();
  }

  // Delete todo with animation
  deleteTodo(index: number): void {
    // Add falling animation class
    this.todos[index].isFalling = true;

    // Remove after animation
    setTimeout(() => {
      this.todos.splice(index, 1);
      this.saveTodosToLocalStorage();
    }, 500);
  }

  // Save todos to localStorage
  saveTodosToLocalStorage(): void {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  // Load todos from localStorage
  loadTodos(): void {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      this.todos = JSON.parse(savedTodos);
    }
  }
}
