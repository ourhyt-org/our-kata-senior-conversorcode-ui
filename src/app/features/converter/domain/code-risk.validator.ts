import { MAX_CODE_LENGTH, RiskValidationResult } from './converter.models';

const PRIVATE_KEY_PATTERN = /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
const AWS_KEY_PATTERN = /AKIA[0-9A-Z]{16}/;
const TOKEN_PATTERN =
  /(token|secret|password|api[_-]?key)\s*[:=]\s*['\"][A-Za-z0-9\-_=]{16,}['\"]/i;

export function validateCodeRisk(
  code: string,
  languageSelected: 'COBOL' | 'DELPHI',
): RiskValidationResult {
  const errors: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    errors.push('Code is required.');
  }

  if (code.length > MAX_CODE_LENGTH) {
    errors.push(`Code exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`);
  }

  if (PRIVATE_KEY_PATTERN.test(code)) {
    errors.push('Private key content detected. Remove secrets before converting.');
  }

  if (AWS_KEY_PATTERN.test(code)) {
    errors.push('AWS access key pattern detected. Remove secrets before converting.');
  }

  if (TOKEN_PATTERN.test(code)) {
    errors.push('Token-like secret detected. Remove secrets before converting.');
  }

  if (languageSelected === 'COBOL') {
    const rawIfCount = (code.match(/\bIF\b/gi) ?? []).length;
    const endIfCount = (code.match(/\bEND-IF\b/gi) ?? []).length;
    const openIfCount = Math.max(0, rawIfCount - endIfCount);
    if (openIfCount > endIfCount) {
      errors.push('COBOL IF/END-IF appears unbalanced.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
