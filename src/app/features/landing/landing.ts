import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// The navbar is rendered once by the application shell, not per page.
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
