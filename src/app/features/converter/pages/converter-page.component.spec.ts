import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { ConverterPageComponent } from './converter-page.component';
import { ConverterState } from '../state/converter.state';
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
    retryLast: jest.fn(async () => undefined),
    selectFile: jest.fn(),
    viewHistory: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConverterPageComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: ConverterState, useValue: converterStateMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConverterPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
});
