import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ConversionApi,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
} from './conversion-api.models';

@Injectable({ providedIn: 'root' })
export class HttpConversionApiService implements ConversionApi {
  private readonly http = inject(HttpClient);

  createConversion(req: CreateConversionRequest): Promise<CreateJobResponse> {
    return firstValueFrom(this.http.post<CreateJobResponse>('/conversions', req));
  }

  getConversionStatus(jobId: string): Promise<JobStatusResponse> {
    return firstValueFrom(this.http.get<JobStatusResponse>(`/conversions/${jobId}`));
  }
}
