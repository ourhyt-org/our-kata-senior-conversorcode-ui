import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageService } from '../storage/local-storage.service';
import { THEME_STORAGE_KEY, ThemeMode } from './theme.models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly modeSignal = signal<ThemeMode>('basic');

  readonly mode = this.modeSignal.asReadonly();

  constructor() {
    const stored = this.localStorageService.getItem(THEME_STORAGE_KEY);
    if (stored === 'basic' || stored === 'advanced') {
      this.modeSignal.set(stored);
    }
    this.applyTheme(this.modeSignal());
  }

  isAdvanced(): boolean {
    return this.modeSignal() === 'advanced';
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.localStorageService.setItem(THEME_STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  toggleMode(): void {
    this.setMode(this.modeSignal() === 'advanced' ? 'basic' : 'advanced');
  }

  private applyTheme(mode: ThemeMode): void {
    this.document.documentElement.setAttribute('data-theme', mode);
  }
}
