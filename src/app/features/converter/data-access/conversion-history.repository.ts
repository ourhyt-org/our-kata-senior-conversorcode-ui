import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../../core/storage/local-storage.service';
import { HISTORY_STORAGE_KEY, HistoryItem, MAX_HISTORY_ITEMS } from '../domain/converter.models';

@Injectable({ providedIn: 'root' })
export class ConversionHistoryRepository {
  private readonly localStorageService = inject(LocalStorageService);

  getAll(): HistoryItem[] {
    const raw = this.localStorageService.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  upsert(item: HistoryItem): void {
    const items = this.getAll();
    const index = items.findIndex((candidate) => candidate.jobId === item.jobId);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    const next = items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_HISTORY_ITEMS);
    this.localStorageService.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  }
}
