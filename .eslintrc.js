module.exports = {
  root: true,
  extends: 'standard',
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2017,
    sourceType: "module"
  },
  env: {
    browser: false,
    node: true
  },
  globals: {
    globalThis: true
  },
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'indent': ['error', 2],
    'one-var': [
      'error',
      {
        'var': 'never',
        'let': 'never',
        'const': 'never'
      }
    ],
    'semi': [2, 'never'],
    'arrow-parens': 0,
    'generator-star-spacing': 'off',
    'no-debugger': (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'homolog')  ? 'error' : 'off',
    'no-new': 0,
    'no-fallthrough': 'off'
  }
}
