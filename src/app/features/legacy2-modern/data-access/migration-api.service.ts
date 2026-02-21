import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { MigrationPayload, MigrationResponseDto } from '../domain/migration.models';

@Injectable({ providedIn: 'root' })
export class MigrationApiService {
  private readonly httpClient = inject(HttpClient);

  migrate(payload: MigrationPayload): Observable<MigrationResponseDto> {
    const apiBaseUrl = environment.API_BASE_URL.replace(/\/$/, '');
    return this.httpClient.post<MigrationResponseDto>(`${apiBaseUrl}/migrate`, payload);
  }
}
