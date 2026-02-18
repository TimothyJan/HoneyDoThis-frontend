// Service for managing application themes
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThemeType } from '../models/themeType.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubject: BehaviorSubject<ThemeType>;
  public theme$: Observable<ThemeType>;

  constructor() {
    // Load saved theme or default to 'standard'
    const savedTheme = localStorage.getItem('savedTheme') as ThemeType || 'standard';
    this.themeSubject = new BehaviorSubject<ThemeType>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();

    this.applyTheme(savedTheme);
  }

  // Synchronous accessor for current theme
  get currentTheme(): ThemeType {
    return this.themeSubject.getValue();
  }

  // Change theme and persist
  changeTheme(theme: ThemeType): void {
    localStorage.setItem('savedTheme', theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  // Apply theme classes to DOM elements
  private applyTheme(theme: ThemeType): void {
    // Update body class for global styles
    document.body.classList.remove('standard', 'light', 'darker');
    document.body.classList.add(theme);

    // Update html element for host styling
    document.documentElement.classList.remove('standard', 'light', 'darker');
    document.documentElement.classList.add(theme);
  }

  // Utility for generating theme-specific class names
  getThemeClass(baseClass: string, theme?: ThemeType): string {
    const currentTheme = theme || this.currentTheme;
    return `${baseClass} ${currentTheme}-${baseClass}`;
  }
}
