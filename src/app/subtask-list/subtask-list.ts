// Component for displaying and managing subtasks within a task
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { ThemeType } from '../models/themeType.model';
import { Subtask } from '../models/subtask.model';
import { ThemeService } from '../services/theme-service';
import { SubtaskService } from '../services/subtask-service';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './subtask-list.html',
  styleUrls: ['./subtask-list.css']
})
export class SubtaskList implements OnInit, OnDestroy {
  @Input() taskId!: number;           // Parent task ID
  @Input() currentTheme!: ThemeType;   // Theme from parent component
  @Input() forceExpanded: boolean = false; // Force expansion (used when adding first subtask)

  newSubtaskText: string = '';
  subtasks: Subtask[] = [];
  expanded: boolean = false;           // Local expansion state
  completionPercentage: number = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private subtaskService: SubtaskService
  ) {}

  ngOnInit(): void {
    // Subscribe to subtasks for this specific task
    this.subscriptions.add(
      this.subtaskService.getSubtasksByTaskId(this.taskId).subscribe(subtasks => {
        this.subtasks = subtasks;

        // Auto-expand if we have subtasks or if forced
        if (subtasks.length > 0 || this.forceExpanded) {
          this.expanded = true;
        }
      })
    );

    // Subscribe to completion percentage for progress display
    this.subscriptions.add(
      this.subtaskService.getTaskCompletionPercentage(this.taskId).subscribe(percentage => {
        this.completionPercentage = percentage;
      })
    );
  }

  ngOnDestroy(): void {
    // Prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  // Toggle subtask section expansion/collapse
  toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  // Add new subtask
  addSubtask(event: Event): void {
    event.preventDefault();
    if (!this.newSubtaskText.trim()) return;

    this.subtaskService.addSubtask(this.taskId, this.newSubtaskText);
    this.newSubtaskText = '';

    // Auto-expand when adding first subtask
    if (!this.expanded) {
      this.expanded = true;
    }
  }

  // Toggle subtask completion
  toggleComplete(subtaskId: number): void {
    this.subtaskService.toggleSubtaskCompletion(subtaskId, this.taskId);
  }

  // Delete subtask with animation
  deleteSubtask(subtaskId: number): void {
    this.subtaskService.deleteSubtask(subtaskId, this.taskId);
  }

  // Handle drag and drop reordering
  drop(event: CdkDragDrop<Subtask[]>): void {
    this.subtaskService.reorderSubtasks(
      this.taskId,
      event.previousIndex,
      event.currentIndex
    );
  }

  // Computed properties for template
  get subtaskCount(): number {
    return this.subtasks.length;
  }

  get completedCount(): number {
    return this.subtasks.filter(s => s.completed).length;
  }

  get hasSubtasks(): boolean {
    return this.subtasks.length > 0;
  }
}
