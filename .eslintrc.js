module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    'react',
    'import',
    'mocha',
    'sdp-fp',
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
    // this repo requires them everywhere (native ESM strict resolution,
    // "type": "module" -- see docs/esm-migration-plan.md). Now that
    // eslint-plugin-import is on a version with `ignorePackages`, bare
    // npm imports (e.g. `from 'ramda'`) are correctly exempted, so this
    // can enforce the real convention instead of being turned off.
    'import/extensions': ['error', 'ignorePackages', {
      js: 'always',
      jsx: 'always',
    }],
    'sdp-fp/max-composition-depth': ['error', {
      max: 11, // TODO: it should be lowered to 6
      ignoreCurry: true,
      ignoreMocha: true,
    }],
    'no-underscore-dangle': ['error', {
      allow: [
        "__", "__dirname", "__filename",
        // Local test-fixture constructors mimicking ReScript variant tags
        // (e.g. `const Number_ = (x) => ({ TAG: 'Number', _0: x })`),
        // trailing-underscore-named to dodge keyword/builtin collisions
        // (Number, Boolean, ...) the same way ReScript's own compiler does.
        "ApproxNumber_", "Boolean_", "Byte_", "Number_", "Pulse_", "String_",
      ], /* Ramda’s R.__; real ESM's fileURLToPath(import.meta.url) replacements for the removed CJS globals */
      allowAfterThis: true,
      allowAfterSuper: true
    }],
    'new-cap': ['error', {
      // ReScript-compiled variant constructors called from JS (never
      // with `new`) -- Maybe/Either/Tuple/StrMap plus the ones newly
      // surfaced by the eslint@8 + eslint-config-airbnb@19 bump (this
      // rule tightened; it wasn't catching these before).
      'capIsNewExceptions': [
        'Maybe', 'Either', 'Tuple', 'StrMap',
        'Ok', 'Err', 'Error', 'Equal',
        'ApproxNumber_', 'Boolean_', 'Byte_', 'Number_', 'Pulse_', 'String_',
        'Command', 'CIPCLOSE', 'CIPDOMAIN', 'CIPMUX', 'CIPSEND', 'CIPSTART',
        'PING', 'TCP', 'ExpectedArgs', 'InvalidConnectionType',
        'InvalidKeepAlive', 'InvalidLinkId', 'InvalidPort',
      ],
      'capIsNewExceptionPattern': '^(Maybe|Either)\..'
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.spec.js',
        // *.test.js: the jest-based packages' naming convention (belt-holes,
        // sdp-tabtest, sdp-tethering-inet), never covered by *.spec.js above.
        '**/*.test.js',
        // Everything else under test/ or test-func/: helper/fixture files
        // (e.g. test/utils.js) that don't match either spec pattern above
        // but are exactly as test-only as the specs that import them.
        '**/test/**/*.js',
        '**/test-func/**/*.js',
        '**/sdp-client-electron/**/*.js',
        '**/sdp-client-electron/**/*.jsx',
        '**/sdp-client/stories/*.jsx',
        '**/sdp-client-browser/tools/*.js',
        '**/sdp-tabtest/tools/*.js',
        '**/sdp-client-browser/benchmark/*.js'
      ]
    }],
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
    'no-unused-vars': ['error', {
        argsIgnorePattern: '^_'
    }],

    'react/forbid-prop-types' : 'off', // TODO: enable and make custom propTypes

    // The eslint@8 + eslint-config-airbnb@19 bump (up from eslint@3 +
    // airbnb@12, a ~2016-era pin) brought a wave of rules that didn't
    // exist -- or weren't this strict -- under the old config. Everything
    // below fires dozens to hundreds of times across this class-component-
    // heavy codebase for patterns that were normal when each file was
    // written, not bugs. Rewriting all of it now would be a large,
    // behavior-risking effort for zero functional change, so it's
    // deliberately deferred rather than done as a side effect of a lint
    // toolchain bump. TODO: adopt these deliberately, file by file.
    //
    // React class-component conventions Airbnb 12 didn't have an opinion
    // on yet (destructure this.props/this.state, always pair an optional
    // propType with a defaultProps entry, avoid {...spread} JSX props,
    // trim unused class methods/state, a fixed method ordering, always set
    // <button type=...>, don't read this.state inside setState, don't use
    // an array index as a React key):
    'react/destructuring-assignment': 'off',
    'react/require-default-props': 'off',
    'react/default-props-match-prop-types': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-unused-class-component-methods': 'off',
    'react/no-unused-state': 'off',
    'react/sort-comp': 'off',
    'react/button-has-type': 'off',
    'react/no-access-state-in-setstate': 'off',
    'react/no-array-index-key': 'off',
    'react/jsx-no-useless-fragment': 'off',
    'react/prop-types': 'off',
    // jsx-a11y went from ^2.2.2 to ^6.10.2 -- a jump of many years of new
    // accessibility rules (keyboard-equivalents for mouse/click handlers,
    // label/control association, autofocus, interactive-role rules).
    // Real, worth doing -- but each one needs a UI check per element, not
    // a blind bulk pass.
    'jsx-a11y/control-has-associated-label': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/mouse-events-have-key-events': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'jsx-a11y/interactive-supports-focus': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    // Generic-JS rules new/tightened the same way, each firing on a
    // small number of pre-existing, intentional patterns (e.g.
    // sequential await-in-loop for serial port polling and benchmark
    // timing, where parallelizing would defeat the purpose):
    'no-await-in-loop': 'off',
    'default-param-last': 'off',
    'no-return-await': 'off',
    'import/no-named-as-default-member': 'off',
    'no-useless-concat': 'off',
    'no-return-assign': 'off',
    'no-promise-executor-return': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-default': 'off',
    'no-restricted-globals': 'off',
    'class-methods-use-this': 'off',
    'no-shadow': 'off',
    'no-multi-assign': 'off',
  },

  overrides: [
    {
      // belt-holes/sdp-tabtest/sdp-tethering-inet run on jest (see Phase 1
      // findings in docs/esm-migration-plan.md), whose globals (test,
      // expect, ...) this config never declared.
      files: [
        'packages/belt-holes/test/**/*.js',
        'packages/sdp-tabtest/test/**/*.js',
        'packages/sdp-tethering-inet/test/**/*.js',
      ],
      env: { jest: true },
    },
    {
      // These test files bind ReScript's own compiled module names
      // (e.g. `Belt_List`, matching @rescript/runtime/lib/js/Belt_List.js)
      // as-is via require() -- renaming to camelCase would just make the
      // test harder to trace back to the module it's testing.
      files: ['packages/belt-holes/test/**/*.js'],
      rules: { camelcase: 'off' },
    },
  ],
};
