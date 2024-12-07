import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default tsEslint.config({
  files: ['src/**/*.ts', 'src/**/*.js'],
  extends: [
    ...tsEslint.configs.recommended,
    prettier
  ],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest
    },
    parser: tsEslint.parser,
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module'
    }
  },
  plugins: {
    '@typescript-eslint': tsEslint.plugin
  },
  ignores: [],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'function-paren-newline': ['error', 'multiline-arguments']
  }
});
