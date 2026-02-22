import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works-panel',
  templateUrl: './how-it-works-panel.component.html',
  styleUrl: './how-it-works-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksPanelComponent {}
