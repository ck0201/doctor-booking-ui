import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '@shared/components/layout/navbar/navbar';

/**
 * Application shell.
 *
 * The navbar lives here and only here, so every routed page gets it without any
 * feature having to render its own copy.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('practice-ui');
}
