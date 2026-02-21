import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReportDto } from '../domain/migration.models';

@Component({
  selector: 'app-migration-report',
  templateUrl: './migration-report.component.html',
  styleUrl: './migration-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigrationReportComponent {
  readonly report = input<ReportDto | null>(null);

  formatLines(lines: number[]): string {
    return lines.length > 0 ? lines.join(', ') : '-';
  }
}
