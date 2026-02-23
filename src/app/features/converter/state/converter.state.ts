import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import {
  AdvancedCreateConversionResponse,
  ConversionStatus,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
} from '../../../core/conversion-api/conversion-api.models';
import { ConversionHistoryRepository } from '../data-access/conversion-history.repository';
import { ConverterResult, HistoryItem } from '../domain/converter.models';

export function getPollingDelayMs(elapsedSeconds: number): number {
  if (elapsedSeconds < 10) {
    return 1000;
  }
  if (elapsedSeconds < 30) {
    return 2000;
  }
  if (elapsedSeconds < 60) {
    return 4000;
  }
  return 6000;
}

const INITIAL_RESULT: ConverterResult = {
  status: 'IDLE',
  jobId: null,
  pollUrl: null,
  elapsedSeconds: 0,
  downloadUrl: null,
  reportUrl: null,
  inlineFiles: [],
  selectedFilePath: null,
  errorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class ConverterState implements OnDestroy {
  private readonly api = inject(CONVERSION_API);
  private readonly historyRepository = inject(ConversionHistoryRepository);

  private readonly resultSignal = signal<ConverterResult>(INITIAL_RESULT);
  private readonly historySignal = signal<HistoryItem[]>(this.historyRepository.getAll());
  private readonly activeRequestSignal = signal<CreateConversionRequest | null>(null);

  private timerId: ReturnType<typeof setInterval> | null = null;
  private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pollErrorCount = 0;

  readonly result = this.resultSignal.asReadonly();
  readonly history = this.historySignal.asReadonly();
  readonly isWorking = computed(
    () => this.resultSignal().status === 'PENDING' || this.resultSignal().status === 'RUNNING',
  );

  async startConversion(request: CreateConversionRequest): Promise<void> {
    this.stopInternalSchedulers();
    this.pollErrorCount = 0;
    this.activeRequestSignal.set(request);
    this.resultSignal.set({ ...INITIAL_RESULT, status: 'PENDING', elapsedSeconds: 0 });

    const createResponse = await this.api.createConversion(request);
    this.consumeCreateResponse(request, createResponse);
  }

  async startAdvancedConversion(
    request: CreateConversionRequest,
    accessToken: string,
  ): Promise<AdvancedCreateConversionResponse> {
    this.stopInternalSchedulers();
    this.pollErrorCount = 0;
    this.activeRequestSignal.set(request);
    this.resultSignal.set({ ...INITIAL_RESULT, status: 'PENDING', elapsedSeconds: 0 });

    const createResponse = await this.api.createAdvancedConversion(request, accessToken);
    this.consumeCreateResponse(request, createResponse);
    return createResponse;
  }

  async retryLast(): Promise<void> {
    const request = this.activeRequestSignal();
    if (!request) {
      return;
    }
    await this.startConversion(request);
  }

  async refreshJobStatus(jobId: string): Promise<ConversionStatus> {
    const response = await this.api.getConversionStatus(jobId);
    this.consumeStatusResponse(response);
    return response.status;
  }

  selectFile(path: string): void {
    this.resultSignal.update((current) => ({ ...current, selectedFilePath: path }));
  }

  viewHistory(item: HistoryItem): void {
    this.resultSignal.update((current) => ({
      ...current,
      jobId: item.jobId,
      status: item.status,
      downloadUrl: item.downloadUrl ?? null,
      reportUrl: item.reportUrl ?? null,
      errorMessage: item.errorMessage ?? null,
    }));
  }

  ngOnDestroy(): void {
    this.stopInternalSchedulers();
  }

  private consumeCreateResponse(
    request: CreateConversionRequest,
    createResponse: CreateJobResponse,
  ): void {
    this.resultSignal.update((current) => ({
      ...current,
      status: createResponse.status,
      jobId: createResponse.jobId,
      pollUrl: createResponse.pollUrl,
    }));
    this.upsertHistory({
      jobId: createResponse.jobId,
      createdAt: new Date().toISOString(),
      source: request.languageSelected,
      target: request.languageTarget,
      status: createResponse.status,
    });
    this.startElapsedTimer();
    this.scheduleNextPoll(0);
  }

  private scheduleNextPoll(delayMs: number): void {
    this.clearPollTimeout();
    this.pollTimeoutId = setTimeout(() => {
      void this.pollOnce();
    }, delayMs);
  }

  private async pollOnce(): Promise<void> {
    const current = this.resultSignal();
    if (!current.jobId) {
      return;
    }

    try {
      const response = await this.api.getConversionStatus(current.jobId);
      this.pollErrorCount = 0;
      this.consumeStatusResponse(response);

      const latest = this.resultSignal();
      if (latest.status === 'PENDING' || latest.status === 'RUNNING') {
        this.scheduleNextPoll(getPollingDelayMs(latest.elapsedSeconds));
      } else {
        this.stopInternalSchedulers();
      }
    } catch {
      this.pollErrorCount += 1;
      if (this.pollErrorCount >= 5) {
        this.resultSignal.update((prev) => ({
          ...prev,
          status: 'FAILED',
          errorMessage: 'Network issues while polling conversion status.',
        }));
        this.persistResultToHistory();
        this.stopInternalSchedulers();
        return;
      }
      this.scheduleNextPoll(2000);
    }
  }

  private consumeStatusResponse(response: JobStatusResponse): void {
    this.resultSignal.update((prev) => ({
      ...prev,
      status: response.status,
      jobId: response.jobId,
      downloadUrl: response.downloadUrl ?? null,
      reportUrl: response.reportUrl ?? null,
      inlineFiles: response.inlineFiles ?? [],
      selectedFilePath:
        prev.selectedFilePath ??
        (response.inlineFiles && response.inlineFiles.length > 0
          ? response.inlineFiles[0].path
          : null),
      errorMessage: response.errorMessage ?? null,
    }));
    this.persistResultToHistory();
  }

  private persistResultToHistory(): void {
    const current = this.resultSignal();
    const request = this.activeRequestSignal();
    if (!current.jobId || !request) {
      return;
    }
    this.upsertHistory({
      jobId: current.jobId,
      createdAt: new Date().toISOString(),
      source: request.languageSelected,
      target: request.languageTarget,
      status: current.status as ConversionStatus,
      downloadUrl: current.downloadUrl ?? undefined,
      reportUrl: current.reportUrl ?? undefined,
      errorMessage: current.errorMessage ?? undefined,
    });
  }

  private upsertHistory(item: HistoryItem): void {
    this.historyRepository.upsert(item);
    this.historySignal.set(this.historyRepository.getAll());
  }

  private startElapsedTimer(): void {
    this.clearElapsedTimer();
    this.timerId = setInterval(() => {
      this.resultSignal.update((current) => ({
        ...current,
        elapsedSeconds: current.elapsedSeconds + 1,
      }));
    }, 1000);
  }

  private stopInternalSchedulers(): void {
    this.clearElapsedTimer();
    this.clearPollTimeout();
  }

  private clearElapsedTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private clearPollTimeout(): void {
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
  }
}
