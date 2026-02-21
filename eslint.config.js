// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const boundaries = /** @type {import("eslint").ESLint.Plugin} */ (
  require('eslint-plugin-boundaries')
);
const jest = require('eslint-plugin-jest');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettier,
    ],
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      boundaries,
    },
    processor: angular.processInlineTemplates,
    settings: {
      'import/resolver': {
        typescript: {
          project: ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json'],
        },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core/*' },
        { type: 'shared', pattern: 'src/app/shared/*' },
        { type: 'feature', pattern: 'src/app/features/*' },
      ],
    },
    rules: {
      'prettier/prettier': 'error',

      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'import/no-duplicates': 'error',

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'core', allow: ['core', 'shared'] },
            { from: 'shared', allow: ['shared'] },
            { from: 'feature', allow: ['feature', 'shared', 'core'] },
          ],
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { jest },
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility, prettier],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]);
