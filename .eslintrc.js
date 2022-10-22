// this tutorial was used: https://robertcooper.me/post/using-eslint-and-prettier-in-a-typescript-project
// on top of https://github.com/cartant/eslint-plugin-etc
const { join } = require('path')
module.exports = {
  parser: '@typescript-eslint/parser',
  overrides: [
    // override default .js parser for typescriptfiles

    // this is done to prevent linting .js files as typescript
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['etc'],
      extends: [
        'eslint:recommended', // recommended eslint
        'plugin:@typescript-eslint/eslint-recommended', // typescript overrides
        'plugin:@typescript-eslint/recommended', // typescript recommends
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        // 'plugin:etc/recommended',
      ],
      parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        project: join(__dirname, './tsconfig.json'),
      },

      env: {
        node: true,
        es6: true,
        jest: true,
      },
      rules: {
        semi: ['off', 'always'],
        quotes: ['error', 'single', { avoidEscape: true }],
        'no-case-declarations': ['warn'],
        'eol-last': ['warn', 'windows'],
        'no-unused-vars': 'off', // disable js unused vars
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ], // use typescript no-unused-vars instead to support types, enums
        'etc/no-commented-out-code': 1,
        'etc/no-enum': 1, // see https://ncjamieson.com/dont-export-const-enums/
        // and
        //https://github.com/cartant/eslint-plugin-etc/blob/main/docs/rules/no-enum.md
        'etc/no-misused-generics': 1,
        'etc/prefer-interface': 1,
      },
    },
  ],
}
