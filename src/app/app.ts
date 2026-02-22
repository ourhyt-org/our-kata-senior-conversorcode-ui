import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './core/theme/theme.service';
import { ConverterPageComponent } from './features/converter/pages/converter-page.component';
import { Legacy2ModernPageComponent } from './features/legacy2-modern/pages/legacy2-modern-page.component';

@Component({
  selector: 'app-root',
  imports: [ConverterPageComponent, Legacy2ModernPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly themeService = inject(ThemeService);
}
