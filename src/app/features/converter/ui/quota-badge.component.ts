import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AdvancedQuotaDto } from '../../../core/conversion-api/conversion-api.models';

@Component({
  selector: 'app-quota-badge',
  templateUrl: './quota-badge.component.html',
  styleUrl: './quota-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotaBadgeComponent {
  readonly quota = input<AdvancedQuotaDto | null>(null);

  readonly tone = computed(() => {
    const quota = this.quota();
    if (!quota) {
      return 'normal';
    }
    if (quota.remaining === 0) {
      return 'danger';
    }
    if (quota.remaining <= Math.max(1, Math.floor(quota.limit * 0.2))) {
      return 'warning';
    }
    return 'normal';
  });
}
