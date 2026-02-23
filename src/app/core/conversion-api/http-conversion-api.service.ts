import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdvancedCreateConversionResponse,
  AdvancedQuotaDto,
  ArchitectureType,
  ConversionApi,
  ConversionFilesParams,
  ConversionFilesResponse,
  ConversionStatus,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
  LanguageSelected,
  LanguageTarget,
  SkippedFile,
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

type BackendAdvancedCreateResponse = BackendCreateConversionResponse & {
  remaining: number;
  limit: number;
  resetAt: string;
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

type BackendManifestItem = string | { path: string };

type BackendSkippedItem = string | { path?: string; reason?: string };

type BackendConversionFilesResponse = {
  defaultFile?: string | null;
  manifest?: BackendManifestItem[];
  skipped?: BackendSkippedItem[];
  files?: Array<{ path: string; content: string }>;
};

@Injectable({ providedIn: 'root' })
export class HttpConversionApiService implements ConversionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  createConversion(req: CreateConversionRequest): Promise<CreateJobResponse> {
    const payload = this.toCreatePayload(req);

    return firstValueFrom(
      this.http.post<BackendCreateConversionResponse>(`${this.baseUrl}/conversions`, payload, {
        headers: this.buildApiKeyHeaders(true),
      }),
    ).then((response) => ({
      jobId: response.jobId,
      status: this.mapStatus(response.status ?? 'PENDING') as 'PENDING' | 'RUNNING',
      pollUrl: response.pollUrl ?? `${this.baseUrl}/conversions/${response.jobId}`,
    }));
  }

  createAdvancedConversion(
    req: CreateConversionRequest,
    accessToken: string,
  ): Promise<AdvancedCreateConversionResponse> {
    const payload = this.toCreatePayload(req);

    return firstValueFrom(
      this.http.post<BackendAdvancedCreateResponse>(
        `${this.baseUrl}/advanced/conversions`,
        payload,
        {
          headers: this.buildAuthHeaders(accessToken),
        },
      ),
    ).then((response) => ({
      jobId: response.jobId,
      status: this.mapStatus(response.status ?? 'PENDING') as 'PENDING' | 'RUNNING',
      pollUrl: response.pollUrl ?? `${this.baseUrl}/conversions/${response.jobId}`,
      remaining: response.remaining,
      limit: response.limit,
      resetAt: response.resetAt,
    }));
  }

  getConversionStatus(jobId: string): Promise<JobStatusResponse> {
    return firstValueFrom(
      this.http.get<BackendJobStatusResponse>(`${this.baseUrl}/conversions/${jobId}`, {
        headers: this.buildApiKeyHeaders(false),
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

  getAdvancedQuota(accessToken: string): Promise<AdvancedQuotaDto> {
    return firstValueFrom(
      this.http.get<AdvancedQuotaDto>(`${this.baseUrl}/advanced/quota`, {
        headers: this.buildAuthHeaders(accessToken),
      }),
    );
  }

  getConversionFiles(
    jobId: string,
    params?: ConversionFilesParams,
  ): Promise<ConversionFilesResponse> {
    let queryParams = new HttpParams();
    if (params?.includeContent !== undefined) {
      queryParams = queryParams.set('includeContent', String(params.includeContent));
    }
    if (params?.paths && params.paths.length > 0) {
      queryParams = queryParams.set('paths', params.paths.join(','));
    }

    return firstValueFrom(
      this.http.get<BackendConversionFilesResponse>(`${this.baseUrl}/conversions/${jobId}/files`, {
        headers: this.buildApiKeyHeaders(false),
        params: queryParams,
      }),
    ).then((response) => ({
      defaultFile: response.defaultFile ?? null,
      manifest: (response.manifest ?? [])
        .map((item) => (typeof item === 'string' ? item : item.path))
        .filter((path): path is string => Boolean(path)),
      skipped: this.mapSkipped(response.skipped ?? []),
      files: response.files ?? [],
    }));
  }

  private toCreatePayload(req: CreateConversionRequest): BackendCreateConversionRequest {
    return {
      languageSelected: this.mapLanguageSelected(req.languageSelected),
      languageTarget: this.mapLanguageTarget(req.languageTarget),
      version: req.version,
      typeArchitected: this.mapArchitecture(req.typeArchitected),
      code: req.codeToConvert,
      options: {},
    };
  }

  private buildApiKeyHeaders(includeContentType: boolean): HttpHeaders {
    const headers: Record<string, string> = {
      'X-API-KEY': environment.apiKey,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return new HttpHeaders(headers);
  }

  private buildAuthHeaders(accessToken: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
  }

  private mapSkipped(items: BackendSkippedItem[]): SkippedFile[] {
    return items
      .map((item): SkippedFile | null => {
        if (typeof item === 'string') {
          return { path: item, reason: 'Skipped by backend' };
        }
        if (!item.path && !item.reason) {
          return null;
        }
        return {
          path: item.path ?? 'unknown',
          reason: item.reason ?? 'Skipped by backend',
        };
      })
      .filter((item): item is SkippedFile => item !== null);
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
