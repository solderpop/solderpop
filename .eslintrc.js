module.exports = {
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    'react',
    'import',
    'mocha',
    'xod-fp',
    'prettier',
  ],

  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/react',
    'plugin:react/recommended',
    'airbnb',
    'prettier',
    'prettier/flowtype',
    'prettier/react',
  ],

  globals: {
    fetch: true,
    window: true,
    confirm: true,
    document: true,
    describe: true,
    it: true,
    specify: true,
    before: true,
    beforeEach: true,
    after: true,
    afterEach: true,
    URLSearchParams: true,
  },

  settings: {
    // Ignore “No named exports found in module” when re-exporting
    // ReasonML generated code
    'import/ignore': ['_Js']
  },

  rules: {
    'prettier/prettier': 'error',
    // Airbnb's base config forbids extensions on relative js/jsx imports;
    // this repo now requires them everywhere (native ESM strict
    // resolution, "type": "module" -- see docs/esm-migration-plan.md),
    // so the inherited rule is actively wrong post-migration. Off rather
    // than flipped to 'always': the installed eslint-plugin-import@1.16.0
    // predates the `ignorePackages` option, so 'always' would also flag
    // every bare npm import (e.g. `from 'ramda'`) as missing an
    // extension. Re-enable once eslint-plugin-import is bumped past the
    // version that added ignorePackages.
    'import/extensions': 'off',
    'xod-fp/max-composition-depth': ['error', {
      max: 11, // TODO: it should be lowered to 6
      ignoreCurry: true,
      ignoreMocha: true,
    }],
    'no-underscore-dangle': ['error', {
      allow: ["__"], /* Ramda’s R.__ */
      allowAfterThis: true,
      allowAfterSuper: true
    }],
    'new-cap': ['error', {
      'capIsNewExceptions': ['Maybe', 'Either', 'Tuple', 'StrMap'],
      'capIsNewExceptionPattern': '^(Maybe|Either)\..'
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        '**/sdp-client-electron/**/*.js',
        '**/sdp-client-electron/**/*.jsx',
        '**/sdp-client/stories/*.jsx',
        '**/sdp-client-browser/tools/*.js',
        '**/sdp-tabtest/tools/*.js',
        '**/sdp-client-browser/test-func/*.js',
        '**/sdp-client-browser/benchmark/*.js'
      ]
    }],
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
    'no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
    }],

    'react/forbid-prop-types' : 'off' // TODO: enable and make custom propTypes
  },
};
