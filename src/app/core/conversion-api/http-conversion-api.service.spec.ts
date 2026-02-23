import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { HttpConversionApiService } from './http-conversion-api.service';

describe('HttpConversionApiService', () => {
  let service: HttpConversionApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HttpConversionApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('posts conversion with mapped payload and x-api-key', async () => {
    const promise = service.createConversion({
      languageSelected: 'COBOL',
      languageTarget: 'JAVA_SPRINGBOOT',
      version: '21',
      typeArchitected: 'HEXAGONAL',
      codeToConvert: 'IF AMOUNT > 0',
      deterministic: true,
      seed: 77,
    });

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/conversions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-API-KEY')).toBe(environment.apiKey);
    expect(request.request.body).toEqual({
      languageSelected: 'cobol',
      languageTarget: 'java',
      version: '21',
      typeArchitected: 'hexagonal',
      code: 'IF AMOUNT > 0',
      options: {
        deterministic: true,
        seed: 77,
      },
    });

    request.flush({
      jobId: 'job-abc',
      status: 'PENDING',
      pollUrl: `${environment.apiBaseUrl}/conversions/job-abc`,
    });

    const response = await promise;
    expect(response.jobId).toBe('job-abc');
    expect(response.status).toBe('PENDING');
  });

  it('gets conversion status with x-api-key', async () => {
    const promise = service.getConversionStatus('job-xyz');

    const request = httpTestingController.expectOne(
      `${environment.apiBaseUrl}/conversions/job-xyz`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-API-KEY')).toBe(environment.apiKey);

    request.flush({
      jobId: 'job-xyz',
      status: 'FINISHED',
      createdAt: '2026-02-23T01:51:51.743Z',
      finishedAt: '2026-02-23T01:52:07.746Z',
      downloadUrl: 'https://example.local/output.zip',
      reportUrl: 'https://example.local/report.json',
      errorMessage: null,
    });

    const response = await promise;
    expect(response.status).toBe('FINISHED');
    expect(response.downloadUrl).toContain('output.zip');
    expect(response.reportUrl).toContain('report.json');
  });
});
