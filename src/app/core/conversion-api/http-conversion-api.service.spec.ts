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
      options: {},
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

  it('posts advanced conversion with authorization only', async () => {
    const promise = service.createAdvancedConversion(
      {
        languageSelected: 'COBOL',
        languageTarget: 'JAVA_SPRINGBOOT',
        version: '21',
        typeArchitected: 'HEXAGONAL',
        codeToConvert: 'IF AMOUNT > 0',
      },
      'token-abc',
    );

    const request = httpTestingController.expectOne(
      `${environment.apiBaseUrl}/advanced/conversions`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-abc');
    expect(request.request.headers.has('X-API-KEY')).toBe(false);

    request.flush({
      jobId: 'job-adv',
      status: 'PENDING',
      pollUrl: `${environment.apiBaseUrl}/conversions/job-adv`,
      remaining: 3,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    });

    const response = await promise;
    expect(response.jobId).toBe('job-adv');
    expect(response.remaining).toBe(3);
  });

  it('gets advanced quota with authorization only', async () => {
    const promise = service.getAdvancedQuota('token-xyz');

    const request = httpTestingController.expectOne(`${environment.apiBaseUrl}/advanced/quota`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-xyz');
    expect(request.request.headers.has('X-API-KEY')).toBe(false);

    request.flush({
      remaining: 1,
      limit: 5,
      resetAt: '2026-02-24T00:00:00.000Z',
    });

    const response = await promise;
    expect(response.limit).toBe(5);
  });
});
