import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import { ConverterPageComponent } from './converter-page.component';
import { ConverterState } from '../state/converter.state';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';

describe('ConverterPageComponent', () => {
  let fixture: ComponentFixture<ConverterPageComponent>;
  const themeMode = signal<'basic' | 'advanced'>('basic');
  const resultSignal = signal({
    status: 'IDLE' as const,
    jobId: null,
    pollUrl: null,
    elapsedSeconds: 0,
    downloadUrl: null,
    reportUrl: null,
    inlineFiles: [],
    selectedFilePath: null,
    errorMessage: null,
  });
  const historySignal = signal<any[]>([]);

  const themeServiceMock = {
    mode: themeMode.asReadonly(),
    isAdvanced: jest.fn(() => themeMode() === 'advanced'),
    toggleMode: jest.fn(() => {
      themeMode.set(themeMode() === 'advanced' ? 'basic' : 'advanced');
    }),
    setMode: jest.fn(),
  };

  const converterStateMock = {
    result: resultSignal.asReadonly(),
    history: historySignal.asReadonly(),
    isWorking: computed(() => {
      const status = resultSignal().status;
      return status === 'PENDING' || status === 'RUNNING';
    }),
    startConversion: jest.fn(async () => undefined),
    startAdvancedConversion: jest.fn(async () => ({
      jobId: 'job-adv',
      status: 'PENDING',
      pollUrl: '/conversions/job-adv',
      remaining: 4,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    })),
    retryLast: jest.fn(async () => undefined),
    selectFile: jest.fn(),
    viewHistory: jest.fn(),
    refreshJobStatus: jest.fn(),
  };

  const conversionApiMock = {
    createConversion: jest.fn(),
    createAdvancedConversion: jest.fn(),
    getConversionStatus: jest.fn(),
    getConversionFiles: jest.fn(),
    getAdvancedQuota: jest.fn(async () => ({
      remaining: 3,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    })),
  };

  const authToken = signal<string | null>(null);

  const authServiceMock = {
    accessToken: authToken.asReadonly(),
    user: signal(null).asReadonly(),
    session: signal(null).asReadonly(),
    isAuthenticated: jest.fn(() => Boolean(authToken())),
    login: jest.fn(async () => undefined),
    logout: jest.fn(async () => {
      authToken.set(null);
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConverterPageComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: ConverterState, useValue: converterStateMock },
        { provide: CONVERSION_API, useValue: conversionApiMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConverterPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    authToken.set(null);
    themeMode.set('basic');
    conversionApiMock.getAdvancedQuota.mockResolvedValue({
      remaining: 3,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    });
  });

  it('blocks submit when risk validation fails', async () => {
    const component = fixture.componentInstance;
    component.form.patchValue({
      languageSelected: 'COBOL',
      languageTarget: 'JAVA_SPRINGBOOT',
      version: '17',
      typeArchitected: 'CLEAN',
      codeToConvert: '-----BEGIN PRIVATE KEY-----',
    });

    await component.convert();

    expect(converterStateMock.startConversion).not.toHaveBeenCalled();
    expect(component.riskErrors().length).toBeGreaterThan(0);
  });

  it('starts conversion with pending payload when valid', async () => {
    const component = fixture.componentInstance;
    component.form.patchValue({
      languageSelected: 'COBOL',
      languageTarget: 'JAVA_SPRINGBOOT',
      version: '17',
      typeArchitected: 'CLEAN',
      codeToConvert: 'DISPLAY "VALID"',
    });

    await component.convert();

    expect(converterStateMock.startConversion).toHaveBeenCalled();
  });

  it('updates available versions when target language changes', () => {
    const component = fixture.componentInstance;
    component.form.controls.languageTarget.setValue('NODE');
    fixture.detectChanges();

    expect(component.availableVersions()).toEqual(['14', '18', '22']);

    component.form.controls.languageTarget.setValue('PYTHON');
    fixture.detectChanges();

    expect(component.availableVersions()).toEqual(['3.10', '3.11', '3.12']);
  });

  it('shows finished links when conversion succeeds', () => {
    resultSignal.set({
      status: 'FINISHED',
      jobId: 'job-1',
      pollUrl: '/conversions/job-1',
      elapsedSeconds: 8,
      downloadUrl: 'https://file.local/zip',
      reportUrl: 'https://file.local/report',
      inlineFiles: [],
      selectedFilePath: null,
      errorMessage: null,
    });

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Download zip');
    expect(host.textContent).toContain('Open report');
  });

  it('shows retry path on failed status', async () => {
    resultSignal.set({
      status: 'FAILED',
      jobId: 'job-1',
      pollUrl: '/conversions/job-1',
      elapsedSeconds: 4,
      downloadUrl: null,
      reportUrl: null,
      inlineFiles: [],
      selectedFilePath: null,
      errorMessage: 'Boom',
    });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    await component.retry();

    expect(converterStateMock.retryLast).toHaveBeenCalled();
  });

  it('disables advanced submit when quota is exhausted', async () => {
    themeMode.set('advanced');
    authToken.set('token-123');
    conversionApiMock.getAdvancedQuota.mockResolvedValue({
      remaining: 0,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    });

    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'app-button button[type="submit"]',
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Daily limit reached');
  });
});
