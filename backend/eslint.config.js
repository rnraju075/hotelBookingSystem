import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
    ],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  // ============================================================
  // PRODUCTION SOURCE CODE
  // ============================================================

  {
    files: ['src/**/*.ts'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // ============================================================
  // TEST CODE
  // ============================================================

  {
    files: [
      'tests/**/*.ts',
    ],

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Test files may intentionally use flexible mock data.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);