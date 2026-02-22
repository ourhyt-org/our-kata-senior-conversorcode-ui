export type LanguageSelected = 'COBOL' | 'DELPHI';
export type LanguageTarget = 'GO' | 'JAVA_SPRINGBOOT' | 'PYTHON' | 'NODE';
export type ArchitectureType = 'CLEAN' | 'HEXAGONAL' | 'LAYERED' | 'MINIMAL';
export type ConversionStatus = 'PENDING' | 'RUNNING' | 'FINISHED' | 'FAILED';

export interface InlineFile {
  path: string;
  language: string;
  content: string;
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

export interface JobStatusResponse {
  jobId: string;
  status: ConversionStatus;
  downloadUrl?: string;
  reportUrl?: string;
  inlineFiles?: InlineFile[];
  errorMessage?: string;
  updatedAt: string;
}

export interface ConversionApi {
  createConversion(req: CreateConversionRequest): Promise<CreateJobResponse>;
  getConversionStatus(jobId: string): Promise<JobStatusResponse>;
}
