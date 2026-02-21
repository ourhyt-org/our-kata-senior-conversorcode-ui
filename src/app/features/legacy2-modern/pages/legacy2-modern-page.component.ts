import type { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MigrationApiService } from '../data-access/migration-api.service';
import type {
  MigrateRequestDto,
  MigrationResponseDto,
  ReportDto,
  SourceLanguage,
  TargetLanguage,
} from '../domain/migration.models';
import { MigrationReportComponent } from '../ui/migration-report.component';

@Component({
  selector: 'app-legacy2-modern-page',
  imports: [ReactiveFormsModule, MigrationReportComponent],
  templateUrl: './legacy2-modern-page.component.html',
  styleUrl: './legacy2-modern-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Legacy2ModernPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly migrationApiService = inject(MigrationApiService);

  readonly sourceLanguageOptions: SourceLanguage[] = ['COBOL', 'DELPHI'];
  readonly targetLanguageOptions: TargetLanguage[] = ['JAVA', 'NODE', 'PYTHON', 'GO'];

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly migratedCode = signal('');
  readonly report = signal<ReportDto | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    legacyCode: ['', [Validators.required]],
    sourceLanguage: ['COBOL' as SourceLanguage, [Validators.required]],
    targetLanguage: ['JAVA' as TargetLanguage, [Validators.required]],
    targetVersion: [''],
  });

  loadSample(): void {
    this.form.patchValue({
      sourceLanguage: 'COBOL',
      legacyCode: [
        '       IDENTIFICATION DIVISION.',
        '       PROGRAM-ID. HELLO-WORLD.',
        '       PROCEDURE DIVISION.',
        "           DISPLAY 'HELLO, LEGACY WORLD'.",
        '           STOP RUN.',
      ].join('\n'),
    });
  }

  copyMigratedCode(): void {
    const value = this.migratedCode();
    if (!value) {
      return;
    }

    void navigator.clipboard.writeText(value);
  }

  migrate(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const rawValue = this.form.getRawValue();
    const payload: MigrateRequestDto = {
      code: rawValue.legacyCode,
      sourceLanguage: rawValue.sourceLanguage,
      targetLanguage: rawValue.targetLanguage,
      ...(rawValue.targetVersion.trim()
        ? {
            targetVersion: rawValue.targetVersion.trim(),
          }
        : {}),
    };

    this.migrationApiService
      .migrate(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: MigrationResponseDto) => {
          this.migratedCode.set(response.outputCode ?? '');
          this.report.set(response.report ?? { appliedRules: [], warnings: [] });
        },
        error: (error: HttpErrorResponse) => {
          this.migratedCode.set('');
          this.report.set(null);
          if (error.status === 401) {
            this.errorMessage.set('Invalid or missing API key');
            return;
          }
          if (error.status === 0) {
            this.errorMessage.set(
              'CORS blocked. Verify API Gateway allows x-api-key and your origin.',
            );
            return;
          }
          this.errorMessage.set('Migration failed. Please try again.');
        },
      });
  }
}
