import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended
  ],
  rules: {
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'classProperty',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require'
      }
    ]
  }
});
