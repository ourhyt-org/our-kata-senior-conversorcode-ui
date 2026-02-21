import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MigrationApiService } from '../data-access/migration-api.service';
import type { MigrationResponseDto } from '../domain/migration.models';
import { Legacy2ModernPageComponent } from './legacy2-modern-page.component';

describe('Legacy2ModernPageComponent', () => {
  let fixture: ComponentFixture<Legacy2ModernPageComponent>;
  const clipboardWriteTextMock = jest.fn<Promise<void>, [string]>();
  const migrationApiServiceMock = {
    migrate: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Legacy2ModernPageComponent],
      providers: [{ provide: MigrationApiService, useValue: migrationApiServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Legacy2ModernPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads sample COBOL code into the textarea', () => {
    const component = fixture.componentInstance;

    component.loadSample();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const legacyCodeInput = host.querySelector(
      '[data-testid="legacy-code-input"]',
    ) as HTMLTextAreaElement;
    expect(legacyCodeInput.value).toContain('IDENTIFICATION DIVISION.');
    expect(legacyCodeInput.value).toContain('PROGRAM-ID. HELLO-WORLD.');
  });

  it('copies migrated code when output exists and skips when empty', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteTextMock },
      configurable: true,
    });

    const component = fixture.componentInstance;

    component.copyMigratedCode();
    expect(clipboardWriteTextMock).not.toHaveBeenCalled();

    component.migratedCode.set('migrated content');
    await component.copyMigratedCode();
    expect(clipboardWriteTextMock).toHaveBeenCalledWith('migrated content');
  });

  it('fills form, runs migrate, and renders migrated code with report', () => {
    const response: MigrationResponseDto = {
      migratedCode: 'public class HelloWorld {}',
      report: {
        appliedRules: [{ name: 'Rename PROGRAM-ID', matches: 1, lines: [2] }],
        warnings: [{ code: 'W001', message: 'DISPLAY converted to println', lines: [4] }],
      },
    };

    migrationApiServiceMock.migrate.mockReturnValue(of(response));

    const host = fixture.nativeElement as HTMLElement;
    const legacyCodeInput = host.querySelector(
      '[data-testid="legacy-code-input"]',
    ) as HTMLTextAreaElement;
    const sourceSelect = host.querySelector('[data-testid="source-language"]') as HTMLSelectElement;
    const targetSelect = host.querySelector('[data-testid="target-language"]') as HTMLSelectElement;
    const migrateButton = host.querySelector('[data-testid="migrate-btn"]') as HTMLButtonElement;

    legacyCodeInput.value = 'IDENTIFICATION DIVISION.';
    legacyCodeInput.dispatchEvent(new Event('input'));
    sourceSelect.value = 'COBOL';
    sourceSelect.dispatchEvent(new Event('change'));
    targetSelect.value = 'JAVA';
    targetSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    migrateButton.click();
    fixture.detectChanges();

    expect(migrationApiServiceMock.migrate).toHaveBeenCalledWith({
      legacyCode: 'IDENTIFICATION DIVISION.',
      sourceLanguage: 'COBOL',
      targetLanguage: 'JAVA',
    });

    const migratedCode = host.querySelector('[data-testid="migrated-code"]') as HTMLElement;
    const report = host.querySelector('[data-testid="report"]') as HTMLElement;
    expect(migratedCode.textContent).toContain('public class HelloWorld {}');
    expect(report.textContent).toContain('Rename PROGRAM-ID');
    expect(report.textContent).toContain('W001');
    expect(report.textContent).toContain('DISPLAY converted to println');
  });

  it('sends targetVersion when provided', () => {
    migrationApiServiceMock.migrate.mockReturnValue(
      of({ migratedCode: '', report: { appliedRules: [], warnings: [] } }),
    );

    const host = fixture.nativeElement as HTMLElement;
    const legacyCodeInput = host.querySelector(
      '[data-testid="legacy-code-input"]',
    ) as HTMLTextAreaElement;
    const targetVersionInput = host.querySelector(
      '[data-testid="target-version"]',
    ) as HTMLInputElement;
    const migrateButton = host.querySelector('[data-testid="migrate-btn"]') as HTMLButtonElement;

    legacyCodeInput.value = 'IDENTIFICATION DIVISION.';
    legacyCodeInput.dispatchEvent(new Event('input'));
    targetVersionInput.value = ' 21 ';
    targetVersionInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    migrateButton.click();
    fixture.detectChanges();

    expect(migrationApiServiceMock.migrate).toHaveBeenCalledWith({
      legacyCode: 'IDENTIFICATION DIVISION.',
      sourceLanguage: 'COBOL',
      targetLanguage: 'JAVA',
      targetVersion: '21',
    });
  });

  it('uses safe fallback values when response fields are missing', () => {
    migrationApiServiceMock.migrate.mockReturnValue(of({} as MigrationResponseDto));

    const host = fixture.nativeElement as HTMLElement;
    const legacyCodeInput = host.querySelector(
      '[data-testid="legacy-code-input"]',
    ) as HTMLTextAreaElement;
    const migrateButton = host.querySelector('[data-testid="migrate-btn"]') as HTMLButtonElement;

    legacyCodeInput.value = 'IDENTIFICATION DIVISION.';
    legacyCodeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    migrateButton.click();
    fixture.detectChanges();

    const migratedCode = host.querySelector('[data-testid="migrated-code"]') as HTMLElement;
    const report = host.querySelector('[data-testid="report"]') as HTMLElement;
    expect(migratedCode.textContent?.trim()).toBe('');
    expect(report.textContent).toContain('No applied rules.');
    expect(report.textContent).toContain('No warnings.');
  });

  it('does not call migrate when form is invalid or loading', () => {
    const component = fixture.componentInstance;
    component.form.patchValue({ legacyCode: '' });
    component.migrate();
    expect(migrationApiServiceMock.migrate).not.toHaveBeenCalled();

    component.form.patchValue({ legacyCode: 'IDENTIFICATION DIVISION.' });
    component.isLoading.set(true);
    component.migrate();
    expect(migrationApiServiceMock.migrate).not.toHaveBeenCalled();
  });

  it('renders error state when migrate fails', () => {
    migrationApiServiceMock.migrate.mockReturnValue(throwError(() => new Error('boom')));

    const host = fixture.nativeElement as HTMLElement;
    const legacyCodeInput = host.querySelector(
      '[data-testid="legacy-code-input"]',
    ) as HTMLTextAreaElement;
    const migrateButton = host.querySelector('[data-testid="migrate-btn"]') as HTMLButtonElement;

    legacyCodeInput.value = 'IDENTIFICATION DIVISION.';
    legacyCodeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    migrateButton.click();
    fixture.detectChanges();

    const errorState = host.querySelector('[data-testid="error-state"]') as HTMLElement;
    expect(errorState.textContent).toContain('Migration failed. Please try again.');
  });
});
