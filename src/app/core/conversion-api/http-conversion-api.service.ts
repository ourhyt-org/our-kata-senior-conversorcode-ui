import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ArchitectureType,
  ConversionApi,
  ConversionStatus,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
  LanguageSelected,
  LanguageTarget,
} from './conversion-api.models';

type BackendCreateConversionRequest = {
  languageSelected: string;
  languageTarget: string;
  version: string;
  typeArchitected: string;
  code: string;
  options: {};
};

type BackendCreateConversionResponse = {
  jobId: string;
  status?: string;
  pollUrl?: string;
};

type BackendJobStatusResponse = {
  jobId: string;
  status: string;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  outputS3Key?: string;
  reportS3Key?: string;
  downloadUrl?: string;
  reportUrl?: string;
  errorMessage?: string | null;
};

@Injectable({ providedIn: 'root' })
export class HttpConversionApiService implements ConversionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'X-API-KEY': environment.apiKey,
  });

  createConversion(req: CreateConversionRequest): Promise<CreateJobResponse> {
    const payload: BackendCreateConversionRequest = {
      languageSelected: this.mapLanguageSelected(req.languageSelected),
      languageTarget: this.mapLanguageTarget(req.languageTarget),
      version: req.version,
      typeArchitected: this.mapArchitecture(req.typeArchitected),
      code: req.codeToConvert,
      options: {},
    };

    return firstValueFrom(
      this.http.post<BackendCreateConversionResponse>(`${this.baseUrl}/conversions`, payload, {
        headers: this.headers,
      }),
    ).then((response) => ({
      jobId: response.jobId,
      status: this.mapStatus(response.status ?? 'PENDING') as 'PENDING' | 'RUNNING',
      pollUrl: response.pollUrl ?? `${this.baseUrl}/conversions/${response.jobId}`,
    }));
  }

  getConversionStatus(jobId: string): Promise<JobStatusResponse> {
    return firstValueFrom(
      this.http.get<BackendJobStatusResponse>(`${this.baseUrl}/conversions/${jobId}`, {
        headers: new HttpHeaders({
          'X-API-KEY': environment.apiKey,
        }),
      }),
    ).then((response) => ({
      jobId: response.jobId,
      status: this.mapStatus(response.status),
      downloadUrl: response.downloadUrl ?? undefined,
      reportUrl: response.reportUrl ?? undefined,
      errorMessage: response.errorMessage ?? undefined,
      updatedAt:
        response.finishedAt ?? response.startedAt ?? response.createdAt ?? new Date().toISOString(),
    }));
  }

  private mapLanguageSelected(value: LanguageSelected): string {
    return value.toLowerCase();
  }

  private mapLanguageTarget(value: LanguageTarget): string {
    if (value === 'JAVA_SPRINGBOOT') {
      return 'java';
    }
    return value.toLowerCase();
  }

  private mapArchitecture(value: ArchitectureType): string {
    return value.toLowerCase();
  }

  private mapStatus(value: string): ConversionStatus {
    const normalized = value.toUpperCase();
    if (normalized === 'RUNNING') {
      return 'RUNNING';
    }
    if (normalized === 'FINISHED') {
      return 'FINISHED';
    }
    if (normalized === 'FAILED') {
      return 'FAILED';
    }
    return 'PENDING';
  }
}
