import { Component, OnInit } from '@angular/core';
import { ThemeType } from '../../models/themeType.model';
import { ThemeService } from '../../services/theme-service';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.html',
  styleUrl: './title.css',
})
export class Title implements OnInit {
  currentTheme: ThemeType = 'standard';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }
}
