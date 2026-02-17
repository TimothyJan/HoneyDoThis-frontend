import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme-service';
import { ThemeType } from '../../models/themeType.model';

@Component({
  selector: 'app-theme',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme.html',
  styleUrls: ['./theme.css'],
})
export class Theme implements OnInit {
  currentTheme: ThemeType = 'standard';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  // Change theme
  changeTheme(theme: ThemeType): void {
    this.themeService.changeTheme(theme);
  }
}
