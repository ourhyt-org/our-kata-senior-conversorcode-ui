import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import type { MigrateRequestDto } from '../domain/migration.models';
import { MigrationApiService } from './migration-api.service';

describe('MigrationApiService', () => {
  let service: MigrationApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MigrationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('calls POST /migrate and sets x-api-key header', () => {
    const requestPayload: MigrateRequestDto = {
      code: 'IDENTIFICATION DIVISION.',
      sourceLanguage: 'COBOL',
      targetLanguage: 'JAVA',
      targetVersion: '21',
    };

    service.migrate(requestPayload).subscribe();

    const request = httpTestingController.expectOne(
      `${environment.apiBaseUrl.replace(/\/$/, '')}/migrate`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestPayload);
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.headers.get('X-API-KEY')).toBe(environment.apiKey);

    request.flush({
      outputCode: 'public class HelloWorld {}',
      report: {
        appliedRules: [],
        warnings: [],
      },
    });
  });
});
