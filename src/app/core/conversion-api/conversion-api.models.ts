export type LanguageSelected = 'COBOL' | 'DELPHI';
export type LanguageTarget = 'GO' | 'JAVA_SPRINGBOOT' | 'PYTHON' | 'NODE';
export type ArchitectureType = 'CLEAN' | 'HEXAGONAL' | 'LAYERED' | 'MINIMAL';
export type ConversionStatus = 'PENDING' | 'RUNNING' | 'FINISHED' | 'FAILED';

export interface InlineFile {
  path: string;
  language: string;
  content: string;
}

export interface ConversionFileContent {
  path: string;
  content: string;
}

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface ConversionFilesResponse {
  defaultFile: string | null;
  manifest: string[];
  skipped: SkippedFile[];
  files?: ConversionFileContent[];
}

export interface CreateConversionRequest {
  languageSelected: LanguageSelected;
  languageTarget: LanguageTarget;
  version: string;
  typeArchitected: ArchitectureType;
  codeToConvert: string;
  deterministic?: boolean;
  seed?: number;
}

export interface CreateJobResponse {
  jobId: string;
  status: 'PENDING' | 'RUNNING';
  pollUrl: string;
}

export interface AdvancedQuotaDto {
  remaining: number;
  limit: number;
  resetAt: string;
}

export interface AdvancedCreateConversionResponse extends CreateJobResponse, AdvancedQuotaDto {}

export interface JobStatusResponse {
  jobId: string;
  status: ConversionStatus;
  downloadUrl?: string;
  reportUrl?: string;
  inlineFiles?: InlineFile[];
  errorMessage?: string;
  updatedAt: string;
}

export interface ConversionFilesParams {
  includeContent?: boolean;
  paths?: string[];
}

export interface ConversionApi {
  createConversion(req: CreateConversionRequest): Promise<CreateJobResponse>;
  createAdvancedConversion(
    req: CreateConversionRequest,
    accessToken: string,
  ): Promise<AdvancedCreateConversionResponse>;
  getConversionStatus(jobId: string): Promise<JobStatusResponse>;
  getAdvancedQuota(accessToken: string): Promise<AdvancedQuotaDto>;
  getConversionFiles(
    jobId: string,
    params?: ConversionFilesParams,
  ): Promise<ConversionFilesResponse>;
}
