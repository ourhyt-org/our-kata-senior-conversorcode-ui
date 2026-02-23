import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.resetTestingModule();
  });

  it('uses basic mode by default', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.mode()).toBe('basic');
    expect(document.documentElement.getAttribute('data-theme')).toBe('basic');
  });

  it('toggles and persists mode', () => {
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    service.toggleMode();

    expect(service.mode()).toBe('advanced');
    expect(localStorage.getItem('legacy-converter-theme:v1')).toBe('advanced');
  });

  it('restores persisted mode', () => {
    localStorage.setItem('legacy-converter-theme:v1', 'advanced');

    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    expect(service.mode()).toBe('advanced');
    expect(service.isAdvanced()).toBe(true);
  });
});
