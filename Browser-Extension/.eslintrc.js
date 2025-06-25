module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    browser: 'readonly'
  },
  rules: {
    // Error prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'warn',
    
    // Best practices
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Security
    'no-unsafe-innerhtml': 'off', // Custom rule, needs plugin
    
    // Code style
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': ['error', 'always'],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    
    // ES6
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'prefer-template': 'warn',
    'template-curly-spacing': ['error', 'never'],
    
    // Async
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'warn',
    'prefer-promise-reject-errors': 'error',
    
    // Browser extension specific
    'no-undef': 'error',
    'no-restricted-globals': ['error', 'event', 'fdescribe']
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};