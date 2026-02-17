import { Component } from '@angular/core';
import { Theme } from "./theme/theme";
import { Title } from './title/title';

@Component({
  selector: 'app-header',
  imports: [
    Theme,
    Title
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

}
