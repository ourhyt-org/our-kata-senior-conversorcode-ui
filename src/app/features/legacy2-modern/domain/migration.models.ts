export type SourceLanguage = 'COBOL' | 'DELPHI';

export type TargetLanguage = 'JAVA' | 'NODE' | 'PYTHON' | 'GO';

export interface MigrateRequestDto {
  code: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  targetVersion?: string;
}

export interface AppliedRuleDto {
  id?: string;
  name: string;
  description?: string;
  matches: number;
  lineNumbers: number[];
}

export interface WarningDto {
  code: string;
  message: string;
  lineNumbers: number[];
}

export interface ReportDto {
  appliedRules: AppliedRuleDto[];
  warnings: WarningDto[];
}

export interface MigrationResponseDto {
  outputCode: string;
  report: ReportDto;
}
