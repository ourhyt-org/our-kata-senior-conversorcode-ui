import { Injectable } from '@angular/core';
import {
  ConversionApi,
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
        inlineFiles: this.buildInlineFiles(job.request),
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

  private buildInlineFiles(req: CreateConversionRequest): JobStatusResponse['inlineFiles'] {
    const ext =
      req.languageTarget === 'JAVA_SPRINGBOOT' ? 'java' : req.languageTarget.toLowerCase();
    return [
      {
        path: `src/main/${req.typeArchitected.toLowerCase()}/App.${ext}`,
        language: req.languageTarget,
        content: this.buildContent(req),
      },
      {
        path: `README.${ext === 'java' ? 'md' : 'txt'}`,
        language: 'TEXT',
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
