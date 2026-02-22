import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-chip',
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly label = input.required<string>();
  readonly tone = input<'pending' | 'running' | 'finished' | 'failed'>('pending');
}
