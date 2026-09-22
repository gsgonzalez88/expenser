/* ESLint 8 legacy config (matches the installed eslint ^8.56). */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // New JSX transform (Vite + @vitejs/plugin-react): no React import needed.
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // This codebase does not use propTypes.
    'react/prop-types': 'off',
    // Allow intentionally-unused args prefixed with _ (e.g. catch/callback params).
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Build/tooling config files run in Node.
      files: ['*.config.js', '*.config.cjs', '.eslintrc.cjs'],
      env: { node: true, browser: false },
    },
  ],
}
