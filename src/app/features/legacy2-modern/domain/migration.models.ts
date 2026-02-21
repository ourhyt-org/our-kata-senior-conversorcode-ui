export type SourceLanguage = 'COBOL' | 'DELPHI';

export type TargetLanguage = 'JAVA' | 'NODE' | 'PYTHON' | 'GO';

export interface MigrateRequestDto {
  code: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  targetVersion?: string;
}

export interface AppliedRuleDto {
  name: string;
  matches: number;
  lines: number[];
}

export interface WarningDto {
  code: string;
  message: string;
  lines: number[];
}

export interface ReportDto {
  appliedRules: AppliedRuleDto[];
  warnings: WarningDto[];
}

export interface MigrationResponseDto {
  outputCode: string;
  report: ReportDto;
}
