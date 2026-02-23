import { LanguageTarget } from '../../../core/conversion-api/conversion-api.models';
import { TargetVersionPolicy } from './converter.models';

export const TARGET_VERSION_POLICIES: TargetVersionPolicy[] = [
  {
    target: 'NODE',
    label: 'Node',
    versions: ['14', '18', '22'],
    defaultVersion: '18',
  },
  {
    target: 'JAVA_SPRINGBOOT',
    label: 'Java Spring Boot',
    versions: ['11', '17', '21'],
    defaultVersion: '17',
  },
  {
    target: 'PYTHON',
    label: 'Python',
    versions: ['3.10', '3.11', '3.12'],
    defaultVersion: '3.11',
  },
  {
    target: 'GO',
    label: 'Go',
    versions: ['1.20', '1.21', '1.22'],
    defaultVersion: '1.21',
  },
];

export function getVersionsForTarget(target: LanguageTarget): TargetVersionPolicy {
  return (
    TARGET_VERSION_POLICIES.find((policy) => policy.target === target) ?? TARGET_VERSION_POLICIES[0]
  );
}
