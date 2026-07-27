import { Component } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [Navbar, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
