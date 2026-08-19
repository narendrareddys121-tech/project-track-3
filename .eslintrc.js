module.exports = {
  env: { node: true, es2021: true, jest: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'commonjs' },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-process-exit': 'off',
    eqeqeq: 'error',
    curly: 'error',
  },
}
