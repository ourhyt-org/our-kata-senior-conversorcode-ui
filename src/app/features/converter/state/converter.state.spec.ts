import { TestBed } from '@angular/core/testing';
import { CONVERSION_API } from '../../../core/conversion-api/conversion-api.token';
import {
  ConversionApi,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
} from '../../../core/conversion-api/conversion-api.models';
import { ConversionHistoryRepository } from '../data-access/conversion-history.repository';
import { ConverterState, getPollingDelayMs } from './converter.state';

class FailingApi implements ConversionApi {
  async createConversion(_: CreateConversionRequest): Promise<CreateJobResponse> {
    return { jobId: 'job-1', status: 'PENDING', pollUrl: '/conversions/job-1' };
  }

  async getConversionStatus(_: string): Promise<JobStatusResponse> {
    throw new Error('network');
  }
}

describe('ConverterState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ConverterState,
        ConversionHistoryRepository,
        { provide: CONVERSION_API, useClass: FailingApi },
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns adaptive polling delays', () => {
    expect(getPollingDelayMs(1)).toBe(1000);
    expect(getPollingDelayMs(12)).toBe(2000);
    expect(getPollingDelayMs(45)).toBe(4000);
    expect(getPollingDelayMs(80)).toBe(6000);
  });

  it('fails after repeated polling network errors', async () => {
    const state = TestBed.inject(ConverterState);

    await state.startConversion({
      languageSelected: 'COBOL',
      languageTarget: 'JAVA_SPRINGBOOT',
      version: '17',
      typeArchitected: 'CLEAN',
      codeToConvert: 'DISPLAY "HELLO"',
    });

    for (let i = 0; i < 6; i += 1) {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    }

    expect(state.result().status).toBe('FAILED');
    expect(state.result().errorMessage).toContain('Network issues');
  });
});
