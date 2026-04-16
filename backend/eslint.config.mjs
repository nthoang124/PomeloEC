// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      boundaries: eslintPluginBoundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'iam', pattern: 'iam/**/*' },
        { type: 'catalog', pattern: 'catalog/**/*' },
        { type: 'inventory', pattern: 'inventory/**/*' },
        { type: 'orders', pattern: 'orders/**/*' },
        { type: 'checkout', pattern: 'checkout/**/*' },
        { type: 'payment', pattern: 'payment/**/*' },
        { type: 'communication', pattern: 'communication/**/*' },
        { type: 'background-jobs', pattern: 'background-jobs/**/*' },
        { type: 'shared', pattern: 'shared/**/*' },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      // Kiến trúc Modular Monolith: Đóng băng ranh giới
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'iam', allow: ['shared'] },
            { from: 'catalog', allow: ['shared'] },
            { from: 'inventory', allow: ['shared'] },
            { from: 'orders', allow: ['shared'] },
            { from: 'checkout', allow: ['shared'] },
            { from: 'payment', allow: ['shared'] },
            { from: 'communication', allow: ['shared'] },
            { from: 'background-jobs', allow: ['shared'] },
            { from: 'shared', allow: ['shared'] }
          ],
        },
      ],
    },
  },
);
