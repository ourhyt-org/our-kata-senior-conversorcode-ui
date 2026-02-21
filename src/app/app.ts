import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Legacy2ModernPageComponent } from './features/legacy2-modern/pages/legacy2-modern-page.component';

@Component({
  selector: 'app-root',
  imports: [Legacy2ModernPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
