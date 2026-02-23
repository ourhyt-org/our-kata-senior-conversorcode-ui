import { validateCodeRisk } from './code-risk.validator';

describe('validateCodeRisk', () => {
  it('does not flag balanced COBOL IF/END-IF blocks', () => {
    const code = [
      'IF Num2 = 0',
      '  DISPLAY "Error"',
      'ELSE',
      '  COMPUTE Result = Num1 / Num2',
      'END-IF',
      'IF Operator = "+"',
      '  DISPLAY "OK"',
      'END-IF',
    ].join('\n');

    const result = validateCodeRisk(code, 'COBOL');

    expect(result.errors).not.toContain('COBOL IF/END-IF appears unbalanced.');
  });

  it('flags unbalanced COBOL IF/END-IF blocks', () => {
    const code = ['IF Num2 = 0', '  DISPLAY "Error"'].join('\n');

    const result = validateCodeRisk(code, 'COBOL');

    expect(result.errors).toContain('COBOL IF/END-IF appears unbalanced.');
  });
});
