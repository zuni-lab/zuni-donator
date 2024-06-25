module.exports = {
  root: true,
  extends: ['base', 'plugin:react-hooks/recommended', 'next/core-web-vitals', 'next'],
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: { '@typescript-eslint/ban-types': 'off' },
    },
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'import', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'arrow-body-style': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'prefer-arrow-callback': 'off',
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
  },
};
