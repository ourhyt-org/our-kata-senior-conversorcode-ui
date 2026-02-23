import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import {
  ArchitectureType,
  LanguageSelected,
  LanguageTarget,
} from '../../../core/conversion-api/conversion-api.models';
import { ThemeService } from '../../../core/theme/theme.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { LoaderComponent } from '../../../shared/ui/loader/loader.component';
import { validateCodeRisk } from '../domain/code-risk.validator';
import { ConverterFormValue } from '../domain/converter.models';
import { getVersionsForTarget, TARGET_VERSION_POLICIES } from '../domain/version-policies';
import { ConverterState } from '../state/converter.state';
import { CodePreviewPanelComponent } from '../ui/code-preview-panel.component';
import { HistoryPanelComponent } from '../ui/history-panel.component';
import { HowItWorksPanelComponent } from '../ui/how-it-works-panel.component';
import { StatusChipComponent } from '../ui/status-chip.component';

@Component({
  selector: 'app-converter-page',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    LoaderComponent,
    StatusChipComponent,
    HowItWorksPanelComponent,
    HistoryPanelComponent,
    CodePreviewPanelComponent,
  ],
  templateUrl: './converter-page.component.html',
  styleUrl: './converter-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConverterPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly themeService = inject(ThemeService);
  readonly converterState = inject(ConverterState);

  readonly targetOptions: Array<{ value: LanguageTarget; label: string }> = [
    { value: 'GO', label: 'Go' },
    { value: 'JAVA_SPRINGBOOT', label: 'Java-springboot' },
    { value: 'PYTHON', label: 'Python' },
    { value: 'NODE', label: 'Node' },
  ];

  readonly sourceOptions: LanguageSelected[] = ['COBOL', 'DELPHI'];
  readonly architectureOptions: Array<{ value: ArchitectureType; label: string }> = [
    { value: 'CLEAN', label: 'Clean' },
    { value: 'HEXAGONAL', label: 'Hexagonal' },
    { value: 'LAYERED', label: 'Layered' },
    { value: 'MINIMAL', label: 'Minimal' },
  ];

  readonly riskErrors = signal<string[]>([]);
  readonly previewOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    languageSelected: ['COBOL' as LanguageSelected, [Validators.required]],
    languageTarget: ['JAVA_SPRINGBOOT' as LanguageTarget, [Validators.required]],
    version: ['17', [Validators.required]],
    typeArchitected: ['CLEAN' as ArchitectureType, [Validators.required]],
    codeToConvert: ['', [Validators.required]],
  });

  private readonly selectedTarget = toSignal(
    this.form.controls.languageTarget.valueChanges.pipe(
      startWith(this.form.controls.languageTarget.value),
    ),
    { initialValue: this.form.controls.languageTarget.value },
  );

  readonly availableVersions = computed(() => {
    const target = this.selectedTarget();
    return getVersionsForTarget(target).versions;
  });

  readonly currentStatus = computed(() => this.converterState.result().status);
  readonly codeLineNumbers = computed(() => {
    const code = this.form.controls.codeToConvert.value;
    const lineCount = Math.max(1, code.split('\n').length);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  });

  constructor() {
    this.form.controls.languageTarget.valueChanges.subscribe((target) => {
      const next = getVersionsForTarget(target).defaultVersion;
      this.form.controls.version.setValue(next);
    });
  }

  async convert(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const raw: ConverterFormValue = this.form.getRawValue();
    const risk = validateCodeRisk(raw.codeToConvert, raw.languageSelected);
    this.riskErrors.set(risk.errors);
    if (!risk.valid) {
      return;
    }

    await this.converterState.startConversion(raw);
  }

  async retry(): Promise<void> {
    await this.converterState.retryLast();
  }

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  onViewHistory(jobId: string): void {
    const match = this.converterState.history().find((item) => item.jobId === jobId);
    if (match) {
      this.converterState.viewHistory(match);
    }
  }

  targetPolicyLabel(target: LanguageTarget): string {
    return TARGET_VERSION_POLICIES.find((policy) => policy.target === target)?.label ?? target;
  }
}
