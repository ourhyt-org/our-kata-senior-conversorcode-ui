import { Injectable } from '@angular/core';
import {
  AdvancedCreateConversionResponse,
  AdvancedQuotaDto,
  ConversionApi,
  ConversionFilesParams,
  ConversionFilesResponse,
  ConversionStatus,
  CreateConversionRequest,
  CreateJobResponse,
  JobStatusResponse,
} from './conversion-api.models';
import { MockRng } from './mock-rng';

interface MockJob {
  request: CreateConversionRequest;
  createdAt: number;
  pendingMs: number;
  runningMs: number;
  shouldFail: boolean;
}

@Injectable({ providedIn: 'root' })
export class MockConversionApiService implements ConversionApi {
  private jobs = new Map<string, MockJob>();

  async createConversion(req: CreateConversionRequest): Promise<CreateJobResponse> {
    return this.createJob(req);
  }

  async createAdvancedConversion(
    req: CreateConversionRequest,
    _: string,
  ): Promise<AdvancedCreateConversionResponse> {
    const response = await this.createJob(req);
    return {
      ...response,
      remaining: 7,
      limit: 10,
      resetAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
  }

  async getConversionStatus(jobId: string): Promise<JobStatusResponse> {
    const job = this.jobs.get(jobId);
    await this.sleep(200);

    if (!job) {
      return {
        jobId,
        status: 'FAILED',
        errorMessage: 'Job not found',
        updatedAt: new Date().toISOString(),
      };
    }

    const elapsed = Date.now() - job.createdAt;
    const status = this.resolveStatus(elapsed, job.pendingMs, job.runningMs, job.shouldFail);

    if (status === 'FINISHED') {
      return {
        jobId,
        status,
        updatedAt: new Date().toISOString(),
        downloadUrl: `https://example-s3.local/${jobId}/converted.zip`,
        reportUrl: `https://example-s3.local/${jobId}/report.json`,
      };
    }

    if (status === 'FAILED') {
      return {
        jobId,
        status,
        updatedAt: new Date().toISOString(),
        errorMessage: 'Conversion failed in worker pipeline',
      };
    }

    return {
      jobId,
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  async getAdvancedQuota(_: string): Promise<AdvancedQuotaDto> {
    await this.sleep(120);
    return {
      remaining: 7,
      limit: 10,
      resetAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
  }

  async getConversionFiles(
    jobId: string,
    params?: ConversionFilesParams,
  ): Promise<ConversionFilesResponse> {
    const job = this.jobs.get(jobId);
    await this.sleep(120);

    if (!job) {
      throw new Error('NOT_FOUND');
    }

    const status = this.resolveStatus(
      Date.now() - job.createdAt,
      job.pendingMs,
      job.runningMs,
      job.shouldFail,
    );
    if (status !== 'FINISHED') {
      throw new Error('NOT_READY');
    }

    const files = this.buildFiles(job.request);
    const manifest = files.map((item) => item.path);
    const defaultFile = manifest[0] ?? null;

    if (params?.includeContent) {
      const requested = params.paths ?? [];
      const selected = files.filter((file) => requested.includes(file.path));
      return {
        defaultFile,
        manifest,
        skipped: [],
        files: selected,
      };
    }

    return {
      defaultFile,
      manifest,
      skipped: [],
    };
  }

  private async createJob(req: CreateConversionRequest): Promise<CreateJobResponse> {
    const rng = this.buildRng(req);
    const jobId = this.createJobId();
    const pendingMs = rng.intBetween(1000, 3000);
    const runningMs = rng.intBetween(3000, 10000);
    const shouldFail = rng.next() < 0.1;

    this.jobs.set(jobId, {
      request: req,
      createdAt: Date.now(),
      pendingMs,
      runningMs,
      shouldFail,
    });

    await this.sleep(250);

    return {
      jobId,
      status: 'PENDING',
      pollUrl: `/conversions/${jobId}`,
    };
  }

  private resolveStatus(
    elapsed: number,
    pendingMs: number,
    runningMs: number,
    shouldFail: boolean,
  ): ConversionStatus {
    if (elapsed < pendingMs) {
      return 'PENDING';
    }
    if (elapsed < pendingMs + runningMs) {
      return 'RUNNING';
    }
    return shouldFail ? 'FAILED' : 'FINISHED';
  }

  private buildFiles(req: CreateConversionRequest): Array<{ path: string; content: string }> {
    const ext =
      req.languageTarget === 'JAVA_SPRINGBOOT' ? 'java' : req.languageTarget.toLowerCase();
    return [
      {
        path: `src/main/${req.typeArchitected.toLowerCase()}/App.${ext}`,
        content: this.buildContent(req),
      },
      {
        path: `src/main/${req.typeArchitected.toLowerCase()}/README.md`,
        content: `Converted from ${req.languageSelected} to ${req.languageTarget}`,
      },
    ];
  }

  private buildContent(req: CreateConversionRequest): string {
    if (req.languageTarget === 'JAVA_SPRINGBOOT') {
      return [
        'package demo;',
        '',
        'public class App {',
        '  void run() {',
        '    logger.info("READY");',
        '  }',
        '}',
      ].join('\n');
    }
    if (req.languageTarget === 'NODE') {
      return ['export function run() {', '  console.log("READY");', '}'].join('\n');
    }
    if (req.languageTarget === 'PYTHON') {
      return ['def run():', '    print("READY")'].join('\n');
    }
    return ['package main', '', 'func main() {', '    println("READY")', '}'].join('\n');
  }

  private buildRng(req: CreateConversionRequest): MockRng {
    if (req.deterministic) {
      return new MockRng(req.seed ?? 12345);
    }
    return new MockRng(Date.now() ^ Math.floor(Math.random() * 100000));
  }

  private createJobId(): string {
    const rand = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `job-${Date.now()}-${rand}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
