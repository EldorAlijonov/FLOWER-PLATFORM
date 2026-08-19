module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist', 'build', 'node_modules', 'coverage', '*.config.js', '*.config.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
