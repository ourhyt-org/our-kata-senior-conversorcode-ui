import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HistoryItem } from '../domain/converter.models';
import { StatusChipComponent } from './status-chip.component';

@Component({
  selector: 'app-history-panel',
  imports: [StatusChipComponent],
  templateUrl: './history-panel.component.html',
  styleUrl: './history-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanelComponent {
  readonly items = input<HistoryItem[]>([]);
  readonly viewDetails = output<HistoryItem>();
}
