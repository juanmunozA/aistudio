import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Los datos de casos exportados por versiones anteriores no tienen un tipo fijo.
    files: ['src/services/caseStateMigration.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
