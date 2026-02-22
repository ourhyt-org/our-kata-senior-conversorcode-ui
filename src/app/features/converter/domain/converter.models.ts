import {
  ArchitectureType,
  ConversionStatus,
  InlineFile,
  LanguageSelected,
  LanguageTarget,
} from '../../../core/conversion-api/conversion-api.models';

export interface TargetVersionPolicy {
  target: LanguageTarget;
  label: string;
  versions: string[];
  defaultVersion: string;
}

export interface HistoryItem {
  jobId: string;
  createdAt: string;
  source: LanguageSelected;
  target: LanguageTarget;
  status: ConversionStatus;
  downloadUrl?: string;
  reportUrl?: string;
  errorMessage?: string;
}

export interface ConverterResult {
  status: ConversionStatus | 'IDLE';
  jobId: string | null;
  pollUrl: string | null;
  elapsedSeconds: number;
  downloadUrl: string | null;
  reportUrl: string | null;
  inlineFiles: InlineFile[];
  selectedFilePath: string | null;
  errorMessage: string | null;
}

export interface RiskValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AdvancedSettings {
  deterministic: boolean;
  seed: number;
}

export const HISTORY_STORAGE_KEY = 'legacy-converter-history:v1';

export const MAX_HISTORY_ITEMS = 50;

export const MAX_CODE_LENGTH = 100000;

export type ConverterFormValue = {
  languageSelected: LanguageSelected;
  languageTarget: LanguageTarget;
  version: string;
  typeArchitected: ArchitectureType;
  codeToConvert: string;
};
