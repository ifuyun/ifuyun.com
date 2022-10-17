module.exports = {
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ['.eslintrc.js', 'md5.ts', 'src/assets/**', 'src/favicon/**', 'src/webmaster/**', '**/*.d.ts'],
  overrides: [
    {
      'files': [
        '*.ts'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'plugin:prettier/recommended'
      ],
      rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'function-paren-newline': ['error', 'multiline-arguments'],
        '@angular-eslint/directive-selector': [
          'error',
          {
            'type': 'attribute',
            'prefix': '',
            'style': 'camelCase'
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            'type': 'element',
            'prefix': ['app', 'i', 'nz'],
            'style': 'kebab-case'
          }
        ]
      }
    }, {
      'files': [
        '*.html'
      ],
      'extends': [
        'plugin:@angular-eslint/template/recommended'
      ],
      'rules': {}
    }
  ]
};
