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
    // Initialize theme from localStorage or default to 'standard'
    const savedTheme = localStorage.getItem('savedTheme') as ThemeType || 'standard';
    this.themeSubject = new BehaviorSubject<ThemeType>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();

    // Apply initial theme
    this.applyTheme(savedTheme);
  }

  // Get current theme value synchronously if needed
  get currentTheme(): ThemeType {
    return this.themeSubject.getValue();
  }

  // Change theme method
  changeTheme(theme: ThemeType): void {
    // Save to localStorage
    localStorage.setItem('savedTheme', theme);

    // Update BehaviorSubject
    this.themeSubject.next(theme);

    // Apply theme
    this.applyTheme(theme);
  }

  // Apply theme classes to both body and html elements
  private applyTheme(theme: ThemeType): void {
    // Remove all theme classes from body
    document.body.classList.remove('standard', 'light', 'darker');
    // Add new theme class to body
    document.body.classList.add(theme);

    // Also apply to html element for host styling
    document.documentElement.classList.remove('standard', 'light', 'darker');
    document.documentElement.classList.add(theme);
  }

  // Helper method to get theme-specific class suffixes
  getThemeClass(baseClass: string, theme?: ThemeType): string {
    const currentTheme = theme || this.currentTheme;
    return `${baseClass} ${currentTheme}-${baseClass}`;
  }
}
