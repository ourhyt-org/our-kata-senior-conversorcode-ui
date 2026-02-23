import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import { ConverterState, getPollingDelayMs } from '../state/converter.state';

@Component({
  selector: 'app-code-preview-panel',
  templateUrl: './code-preview-panel.component.html',
  styleUrl: './code-preview-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodePreviewPanelComponent {
  private readonly api = inject(CONVERSION_API);
  private readonly converterState = inject(ConverterState);

  readonly jobId = input<string | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();

  readonly manifest = signal<string[]>([]);
  readonly skipped = signal<Array<{ path: string; reason: string }>>([]);
  readonly selectedPath = signal<string | null>(null);
  readonly filterText = signal('');
  readonly selectedContent = signal('');
  readonly loadingManifest = signal(false);
  readonly loadingContent = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly notReadyMessage = signal<string | null>(null);
  readonly skippedExpanded = signal(false);

  private readonly filesCache = new Map<string, string>();
  private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private notReadyElapsed = 0;

  readonly filteredManifest = computed(() => {
    const query = this.filterText().trim().toLowerCase();
    if (!query) {
      return this.manifest();
    }
    return this.manifest().filter((path) => path.toLowerCase().includes(query));
  });

  readonly selectedLineNumbers = computed(() => {
    const lines = this.selectedContent().split('\n').length;
    return Array.from({ length: Math.max(lines, 1) }, (_, index) => index + 1);
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const currentJobId = this.jobId();

      if (!isOpen || !currentJobId) {
        this.stopNotReadyPolling();
        return;
      }

      void this.loadManifest(currentJobId);
    });
  }

  updateFilter(value: string): void {
    this.filterText.set(value);
  }

  toggleSkipped(): void {
    this.skippedExpanded.update((value) => !value);
  }

  close(): void {
    this.stopNotReadyPolling();
    this.closed.emit();
  }

  async selectFile(path: string): Promise<void> {
    this.selectedPath.set(path);
    this.errorMessage.set(null);

    const cached = this.filesCache.get(path);
    if (cached !== undefined) {
      this.selectedContent.set(cached);
      return;
    }

    const currentJobId = this.jobId();
    if (!currentJobId) {
      return;
    }

    this.loadingContent.set(true);
    try {
      const response = await this.api.getConversionFiles(currentJobId, {
        includeContent: true,
        paths: [path],
      });
      const file = response.files?.find((item) => item.path === path);
      if (!file) {
        this.selectedContent.set('');
        this.errorMessage.set('File content not found.');
        return;
      }
      this.filesCache.set(path, file.content);
      this.selectedContent.set(file.content);
    } catch (error) {
      this.handleFilesError(error, currentJobId);
    } finally {
      this.loadingContent.set(false);
    }
  }

  private async loadManifest(jobId: string): Promise<void> {
    this.loadingManifest.set(true);
    this.errorMessage.set(null);
    this.notReadyMessage.set(null);
    this.filesCache.clear();
    this.selectedContent.set('');

    try {
      const response = await this.api.getConversionFiles(jobId);
      this.stopNotReadyPolling();
      this.manifest.set(response.manifest ?? []);
      this.skipped.set(response.skipped ?? []);

      const defaultPath =
        response.defaultFile && response.manifest.includes(response.defaultFile)
          ? response.defaultFile
          : (response.manifest[0] ?? null);

      this.selectedPath.set(defaultPath);
      if (defaultPath) {
        await this.selectFile(defaultPath);
      }
    } catch (error) {
      this.handleFilesError(error, jobId);
    } finally {
      this.loadingManifest.set(false);
    }
  }

  private handleFilesError(error: unknown, jobId: string): void {
    const status = this.extractStatus(error);

    if (status === 409) {
      this.notReadyMessage.set('Still processing...');
      this.startNotReadyPolling(jobId);
      return;
    }

    this.stopNotReadyPolling();

    if (status === 404) {
      this.errorMessage.set('Job not found.');
      return;
    }

    if (status >= 500) {
      this.errorMessage.set('Server error while loading files. Please try again.');
      return;
    }

    this.errorMessage.set('Unable to load file preview.');
  }

  private startNotReadyPolling(jobId: string): void {
    this.stopNotReadyPolling();
    this.notReadyElapsed = 0;

    const poll = async () => {
      if (!this.open() || this.jobId() !== jobId) {
        return;
      }

      try {
        const status = await this.converterState.refreshJobStatus(jobId);
        if (status === 'FINISHED') {
          await this.loadManifest(jobId);
          return;
        }
        if (status === 'FAILED') {
          this.errorMessage.set('Conversion failed before files became available.');
          this.notReadyMessage.set(null);
          return;
        }
      } catch {
        this.errorMessage.set('Status check failed while waiting for files.');
        return;
      }

      this.notReadyElapsed += 2;
      this.pollTimeoutId = setTimeout(() => {
        void poll();
      }, getPollingDelayMs(this.notReadyElapsed));
    };

    this.pollTimeoutId = setTimeout(() => {
      void poll();
    }, 1000);
  }

  private stopNotReadyPolling(): void {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
  }

  private extractStatus(error: unknown): number {
    if (error instanceof HttpErrorResponse) {
      return error.status;
    }
    if (error instanceof Error) {
      if (error.message === 'NOT_READY') {
        return 409;
      }
      if (error.message === 'NOT_FOUND') {
        return 404;
      }
    }
    return 500;
  }
}
