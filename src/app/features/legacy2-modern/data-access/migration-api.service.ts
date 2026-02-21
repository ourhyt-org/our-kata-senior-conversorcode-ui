import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { MigrateRequestDto, MigrationResponseDto } from '../domain/migration.models';

@Injectable({ providedIn: 'root' })
export class MigrationApiService {
  private readonly httpClient = inject(HttpClient);

  migrate(request: MigrateRequestDto): Observable<MigrationResponseDto> {
    const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-API-KEY': environment.apiKey,
    });
    return this.httpClient.post<MigrationResponseDto>(`${apiBaseUrl}/migrate`, request, { headers });
  }
}
