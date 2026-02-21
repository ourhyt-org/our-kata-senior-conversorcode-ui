import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { MigrationReportComponent } from './migration-report.component';

describe('MigrationReportComponent', () => {
  let fixture: ComponentFixture<MigrationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MigrationReportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MigrationReportComponent);
    fixture.detectChanges();
  });

  it('renders empty state when no report exists', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('No report yet.');
  });

  it('renders applied rules and warnings when report exists', () => {
    fixture.componentRef.setInput('report', {
      appliedRules: [{ name: 'Rule 1', matches: 2, lines: [1, 3] }],
      warnings: [{ code: 'W100', message: 'Sample warning', lines: [9] }],
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Rule 1');
    expect(host.textContent).toContain('matches: 2');
    expect(host.textContent).toContain('lines: 1, 3');
    expect(host.textContent).toContain('W100');
    expect(host.textContent).toContain('Sample warning');
  });

  it('formats line arrays for both empty and non-empty values', () => {
    const component = fixture.componentInstance;

    expect(component.formatLines([5, 8])).toBe('5, 8');
    expect(component.formatLines([])).toBe('-');
  });
});
