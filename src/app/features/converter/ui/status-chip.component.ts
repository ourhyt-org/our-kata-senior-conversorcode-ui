import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ConversionStatus } from '../../../core/conversion-api/conversion-api.models';
import { ChipComponent } from '../../../shared/ui/chip/chip.component';

@Component({
  selector: 'app-status-chip',
  imports: [ChipComponent],
  templateUrl: './status-chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  readonly status = input.required<ConversionStatus | 'IDLE'>();

  readonly tone = computed<'pending' | 'running' | 'finished' | 'failed'>(() => {
    const status = this.status();
    if (status === 'FINISHED') {
      return 'finished';
    }
    if (status === 'FAILED') {
      return 'failed';
    }
    if (status === 'RUNNING') {
      return 'running';
    }
    return 'pending';
  });
}
