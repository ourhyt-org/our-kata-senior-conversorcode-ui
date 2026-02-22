import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ArchitectureType,
  LanguageSelected,
  LanguageTarget,
} from '../../../core/conversion-api/conversion-api.models';
import { ThemeService } from '../../../core/theme/theme.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { LoaderComponent } from '../../../shared/ui/loader/loader.component';
import { validateCodeRisk } from '../domain/code-risk.validator';
import { AdvancedSettings, ConverterFormValue } from '../domain/converter.models';
import { getVersionsForTarget, TARGET_VERSION_POLICIES } from '../domain/version-policies';
import { ConverterState } from '../state/converter.state';
import { CodePreviewTabsComponent } from '../ui/code-preview-tabs.component';
import { FileTreeComponent } from '../ui/file-tree.component';
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
    FileTreeComponent,
    CodePreviewTabsComponent,
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
  readonly advancedSettings = signal<AdvancedSettings>({ deterministic: false, seed: 12345 });

  readonly form = this.fb.nonNullable.group({
    languageSelected: ['COBOL' as LanguageSelected, [Validators.required]],
    languageTarget: ['JAVA_SPRINGBOOT' as LanguageTarget, [Validators.required]],
    version: ['17', [Validators.required]],
    typeArchitected: ['CLEAN' as ArchitectureType, [Validators.required]],
    codeToConvert: ['', [Validators.required]],
  });

  readonly availableVersions = computed(() => {
    const target = this.form.controls.languageTarget.value;
    return getVersionsForTarget(target).versions;
  });

  readonly currentStatus = computed(() => this.converterState.result().status);
  readonly selectedInlineFile = computed(() => {
    const result = this.converterState.result();
    if (!result.selectedFilePath) {
      return null;
    }
    return result.inlineFiles.find((file) => file.path === result.selectedFilePath) ?? null;
  });

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

  updateDeterministic(value: boolean): void {
    this.advancedSettings.update((current) => ({ ...current, deterministic: value }));
  }

  updateSeed(value: string): void {
    const parsed = Number.parseInt(value, 10);
    this.advancedSettings.update((current) => ({
      ...current,
      seed: Number.isNaN(parsed) ? current.seed : parsed,
    }));
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

    await this.converterState.startConversion({
      ...raw,
      deterministic: this.advancedSettings().deterministic,
      seed: this.advancedSettings().seed,
    });
  }

  async retry(): Promise<void> {
    await this.converterState.retryLast();
  }

  onSelectFile(path: string): void {
    this.converterState.selectFile(path);
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
