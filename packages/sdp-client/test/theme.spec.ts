import { readFileSync } from 'node:fs';
import chai from 'chai';

import * as actions from '../src/theme/actions.ts';
import reducer from '../src/theme/reducer.ts';
import { COLOR_KEYS, toCssVar } from '../src/theme/colorRegistry.ts';
import {
  BUNDLED_THEMES,
  FALLBACK_COLORS,
  INITIAL_STATE,
  buildThemeState,
} from '../src/theme/state.ts';
import { parseTheme, toThemeFile } from '../src/theme/themeFile.ts';
import { createThemePersistenceMiddleware } from '../src/theme/persistenceMiddleware.ts';
import type { Theme } from '../src/theme/themeFile.ts';

const assert: Chai.AssertStatic = chai.assert;

const readJson = (rel: string) =>
  JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));

describe('Theme', () => {
  describe('color registry', () => {
    it('maps dotted keys to kebab-case CSS variables', () => {
      assert.equal(
        toCssVar('deployPanel.titleBar.background'),
        '--theme-deploy-panel-title-bar-background'
      );
    });

    it('has unique CSS variables', () => {
      const vars = COLOR_KEYS.map(toCssVar);
      assert.equal(new Set(vars).size, vars.length);
    });
  });

  describe('first-party themes', () => {
    ['light', 'navy', 'nordic'].forEach((id) => {
      it(`${id}.json defines exactly the registry colors`, () => {
        const file = readJson(`../themes/${id}.json`);
        assert.sameMembers(Object.keys(file.colors), COLOR_KEYS);
        assert.deepEqual(
          parseTheme(file, 'bundled', FALLBACK_COLORS).warnings,
          []
        );
      });
    });

    it('theme.schema.json is up to date (run `pnpm gen:theme-schema`)', () => {
      const schema = readJson('../themes/theme.schema.json');
      assert.sameMembers(
        Object.keys(schema.properties.colors.properties),
        COLOR_KEYS
      );
    });
  });

  describe('parseTheme', () => {
    it('rejects files without a valid id', () => {
      assert.isNull(parseTheme({ name: 'x' }, 'user', FALLBACK_COLORS).theme);
      assert.isNull(
        parseTheme({ id: '../evil' }, 'user', FALLBACK_COLORS).theme
      );
      assert.isNull(parseTheme('nope', 'user', FALLBACK_COLORS).theme);
    });

    it('fills missing and invalid colors from the same-type fallback', () => {
      const { theme, warnings } = parseTheme(
        {
          id: 'partial',
          type: 'light',
          colors: {
            'canvas.background': '#ABCDEF',
            'node.border': 'red',
            'not.a.key': '#000000',
          },
        },
        'user',
        FALLBACK_COLORS
      );
      assert.equal(theme?.colors['canvas.background'], '#abcdef');
      assert.equal(
        theme?.colors['node.border'],
        FALLBACK_COLORS.light['node.border']
      );
      assert.equal(
        theme?.colors['window.background'],
        FALLBACK_COLORS.light['window.background']
      );
      assert.notProperty(theme?.colors ?? {}, 'not.a.key');
      assert.lengthOf(warnings, 2);
    });

    it('round-trips through toThemeFile', () => {
      const [light] = BUNDLED_THEMES;
      const file = toThemeFile(light);
      assert.notProperty(file, 'source');
      assert.deepEqual(
        parseTheme(file, 'bundled', FALLBACK_COLORS).theme,
        light
      );
    });
  });

  describe('buildThemeState', () => {
    it('keeps first-party themes when a user theme reuses their id', () => {
      const impostor: Theme = {
        ...BUNDLED_THEMES[1],
        name: 'Fake',
        source: 'user',
      };
      const state = buildThemeState([...BUNDLED_THEMES, impostor]);
      assert.equal(state.themes[impostor.id].source, 'bundled');
    });

    it('falls back to the default theme for an unknown saved id', () => {
      assert.equal(
        buildThemeState(BUNDLED_THEMES, 'gone').currentTheme,
        'light'
      );
      assert.equal(
        buildThemeState(BUNDLED_THEMES, 'navy').currentTheme,
        'navy'
      );
    });
  });

  describe('reducer', () => {
    it('forks a first-party theme on its first edit', () => {
      const navy = reducer(INITIAL_STATE, actions.setTheme('navy'));
      const edited = reducer(
        navy,
        actions.setThemeColor('canvas.background', '#000000')
      );

      assert.equal(edited.currentTheme, 'navy-custom');
      assert.equal(edited.themes['navy-custom'].name, 'Navy (custom)');
      assert.equal(edited.themes['navy-custom'].source, 'user');
      assert.equal(
        edited.themes['navy-custom'].colors['canvas.background'],
        '#000000'
      );
      assert.deepEqual(edited.themes.navy, INITIAL_STATE.themes.navy);

      const again = reducer(
        edited,
        actions.setThemeColor('canvas.gridlines', '#111111')
      );
      assert.equal(again.currentTheme, 'navy-custom');
      assert.lengthOf(Object.keys(again.themes), 4);
    });

    it('deletes only user themes', () => {
      const forked = reducer(
        reducer(INITIAL_STATE, actions.setTheme('navy')),
        actions.setThemeColor('canvas.background', '#000000')
      );
      assert.strictEqual(reducer(forked, actions.deleteTheme('navy')), forked);

      const deleted = reducer(forked, actions.deleteTheme('navy-custom'));
      assert.notProperty(deleted.themes, 'navy-custom');
      assert.equal(deleted.currentTheme, 'light');
    });
  });

  describe('persistence middleware', () => {
    it('saves the selected theme, user theme edits and deletions', async () => {
      const calls: string[] = [];
      const middleware = createThemePersistenceMiddleware({
        saveCurrentTheme: (id) => calls.push(`current:${id}`),
        saveUserTheme: (t) => calls.push(`save:${t.id}`),
        deleteUserTheme: (id) => calls.push(`delete:${id}`),
      });
      let state = { theme: INITIAL_STATE };
      const store = { getState: () => state, dispatch: () => undefined };
      const dispatch = middleware(store as never)((action) => {
        state = { theme: reducer(state.theme, action as actions.ThemeAction) };
        return action;
      });

      dispatch(actions.setTheme('nordic'));
      dispatch(actions.setThemeColor('canvas.background', '#000000'));
      dispatch(actions.setThemeColor('canvas.background', '#010101'));
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch(actions.deleteTheme('nordic-custom'));

      assert.deepEqual(calls, [
        'current:nordic',
        'current:nordic-custom',
        'save:nordic-custom',
        'current:light',
        'delete:nordic-custom',
      ]);
    });
  });
});
