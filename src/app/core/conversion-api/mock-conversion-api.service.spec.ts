import { MockConversionApiService } from './mock-conversion-api.service';

describe('MockConversionApiService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-22T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps deterministic status behavior with same seed', async () => {
    const service = new MockConversionApiService();
    const req = {
      languageSelected: 'COBOL' as const,
      languageTarget: 'JAVA_SPRINGBOOT' as const,
      version: '17',
      typeArchitected: 'CLEAN' as const,
      codeToConvert: 'DISPLAY "HELLO"',
      deterministic: true,
      seed: 42,
    };

    const createOnePromise = service.createConversion(req);
    jest.advanceTimersByTime(300);
    const createOne = await createOnePromise;

    const createTwoPromise = service.createConversion(req);
    jest.advanceTimersByTime(300);
    const createTwo = await createTwoPromise;

    jest.setSystemTime(new Date('2026-02-22T10:00:40.000Z'));

    const statusOnePromise = service.getConversionStatus(createOne.jobId);
    jest.advanceTimersByTime(250);
    const statusOne = await statusOnePromise;

    const statusTwoPromise = service.getConversionStatus(createTwo.jobId);
    jest.advanceTimersByTime(250);
    const statusTwo = await statusTwoPromise;

    expect(statusOne.status).toBe(statusTwo.status);
    expect(['FINISHED', 'FAILED']).toContain(statusOne.status);
  });
});
