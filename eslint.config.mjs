import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: [
      '**/coverage',
      '**/dist',
      '**/__fixtures__',
      '**/jest.config.js',
      '**/jest.config.base.js',
      'examples',
      'packages/canonical-json',
      'eslint.config.mjs',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: ['./packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "caughtErrors": "none" }],
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  }
);
