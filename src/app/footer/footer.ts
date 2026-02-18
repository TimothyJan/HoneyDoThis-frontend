import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeType } from '../models/themeType.model';
import { ThemeService } from '../services/theme-service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  currentTheme: ThemeType = 'standard';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }
}
