import { Component, signal } from '@angular/core';
import { Main } from "./main/main";
import { Theme } from './header/theme/theme';
import { Title } from './header/title/title';
import { Header } from './header/header';

@Component({
  selector: 'app-root',
  imports: [
    Header,
    Main,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('honeyDoThis');
}
