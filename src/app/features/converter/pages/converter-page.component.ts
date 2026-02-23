import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import {
  AdvancedQuotaDto,
  ArchitectureType,
  LanguageSelected,
  LanguageTarget,
} from '../../../core/conversion-api/conversion-api.models';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { LoaderComponent } from '../../../shared/ui/loader/loader.component';
import { validateCodeRisk } from '../domain/code-risk.validator';
import { ConverterFormValue } from '../domain/converter.models';
import { getVersionsForTarget, TARGET_VERSION_POLICIES } from '../domain/version-policies';
import { ConverterState } from '../state/converter.state';
import { AdvancedAuthPanelComponent } from '../ui/advanced-auth-panel.component';
import { CodePreviewPanelComponent } from '../ui/code-preview-panel.component';
import { HistoryPanelComponent } from '../ui/history-panel.component';
import { HowItWorksPanelComponent } from '../ui/how-it-works-panel.component';
import { QuotaBadgeComponent } from '../ui/quota-badge.component';
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
    AdvancedAuthPanelComponent,
    QuotaBadgeComponent,
  ],
  templateUrl: './converter-page.component.html',
  styleUrl: './converter-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConverterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly conversionApi = inject(CONVERSION_API);
  readonly authService = inject(AuthService);
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
  readonly authLoading = signal(false);
  readonly authError = signal<string | null>(null);
  readonly quotaLoading = signal(false);
  readonly quota = signal<AdvancedQuotaDto | null>(null);
  readonly networkError = signal<string | null>(null);

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
  readonly isAdvancedMode = computed(() => this.themeService.mode() === 'advanced');
  readonly isAdvancedAuthenticated = computed(() => Boolean(this.authService.accessToken()));
  readonly isSubmitDisabled = computed(() => {
    if (this.converterState.isWorking()) {
      return true;
    }
    if (!this.isAdvancedMode()) {
      return false;
    }
    if (!this.isAdvancedAuthenticated() || this.quotaLoading()) {
      return true;
    }
    const currentQuota = this.quota();
    return !currentQuota || currentQuota.remaining <= 0;
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

    effect(() => {
      if (!this.isAdvancedMode()) {
        return;
      }
      const accessToken = this.authService.accessToken();
      if (!accessToken) {
        this.quota.set(null);
        return;
      }
      untracked(() => {
        void this.loadAdvancedQuota(accessToken);
      });
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
    this.networkError.set(null);

    if (this.isAdvancedMode()) {
      const accessToken = this.authService.accessToken();
      if (!accessToken) {
        this.authError.set('Sign in to Advanced Mode before converting.');
        return;
      }
      const currentQuota = this.quota();
      if (!currentQuota || currentQuota.remaining <= 0) {
        this.networkError.set('Daily limit reached.');
        return;
      }
      try {
        const advancedResponse = await this.converterState.startAdvancedConversion(
          raw,
          accessToken,
        );
        this.quota.set({
          remaining: advancedResponse.remaining,
          limit: advancedResponse.limit,
          resetAt: advancedResponse.resetAt,
        });
      } catch (error) {
        await this.handleAdvancedHttpError(error);
      }
      return;
    }

    await this.converterState.startConversion(raw);
  }

  async retry(): Promise<void> {
    if (this.isAdvancedMode()) {
      const accessToken = this.authService.accessToken();
      if (!accessToken) {
        this.authError.set('Sign in to Advanced Mode before retrying.');
        return;
      }
      const payload: ConverterFormValue = this.form.getRawValue();
      try {
        const advancedResponse = await this.converterState.startAdvancedConversion(
          payload,
          accessToken,
        );
        this.quota.set({
          remaining: advancedResponse.remaining,
          limit: advancedResponse.limit,
          resetAt: advancedResponse.resetAt,
        });
      } catch (error) {
        await this.handleAdvancedHttpError(error);
      }
      return;
    }
    await this.converterState.retryLast();
  }

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  async signInToAdvanced(credentials: { email: string; password: string }): Promise<void> {
    this.authError.set(null);
    this.networkError.set(null);
    this.authLoading.set(true);
    try {
      await this.authService.login(credentials.email, credentials.password);
    } catch (error) {
      this.authError.set(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please check your credentials.',
      );
    } finally {
      this.authLoading.set(false);
    }
  }

  async signOutFromAdvanced(): Promise<void> {
    this.authError.set(null);
    this.networkError.set(null);
    this.quota.set(null);
    await this.authService.logout();
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

  private async loadAdvancedQuota(accessToken: string): Promise<void> {
    if (this.quotaLoading()) {
      return;
    }
    this.quotaLoading.set(true);
    this.authError.set(null);
    try {
      const quota = await this.conversionApi.getAdvancedQuota(accessToken);
      this.quota.set(quota);
      if (quota.remaining <= 0) {
        this.networkError.set('Daily limit reached.');
      } else {
        this.networkError.set(null);
      }
    } catch (error) {
      await this.handleAdvancedHttpError(error);
    } finally {
      this.quotaLoading.set(false);
    }
  }

  private async handleAdvancedHttpError(error: unknown): Promise<void> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.authError.set('Session expired. Please sign in again.');
        this.quota.set(null);
        await this.authService.logout();
        return;
      }
      if (error.status === 429) {
        const payload = (error.error ?? {}) as Partial<AdvancedQuotaDto>;
        if (
          typeof payload.remaining === 'number' &&
          typeof payload.limit === 'number' &&
          typeof payload.resetAt === 'string'
        ) {
          this.quota.set({
            remaining: payload.remaining,
            limit: payload.limit,
            resetAt: payload.resetAt,
          });
        }
        this.networkError.set('Daily limit reached.');
        return;
      }
      if (error.status === 0) {
        this.networkError.set('Network error. Please try again.');
        return;
      }
    }
    this.networkError.set('Unable to complete advanced request.');
  }
}
