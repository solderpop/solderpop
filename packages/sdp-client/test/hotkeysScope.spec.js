import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';

import HotkeysScope from '../src/utils/components/HotkeysScope.jsx';
import { COMMAND } from '../src/utils/constants.js';

const { assert } = chai;

describe('react-hotkeys migration (HotkeysScope)', () => {
  it('fires a bound COMMAND handler for its real hotkey combo, and suppresses one listed in disabledCommands even though it has both a handler and a real combo', async () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="root"></div></body></html>'
    );
    global.window = dom.window;
    global.document = dom.window.document;
    // react-hotkeys-hook's focus-containment check (is the focused element
    // inside the scoped element?) references the bare globals `Document`/
    // `ShadowRoot`, not `window.Document` -- real browsers have those as
    // ambient globals; jsdom only puts them on `window`.
    global.Document = dom.window.Document;
    global.ShadowRoot = dom.window.ShadowRoot;

    try {
      let selectAllCalls = 0;
      let deselectCalls = 0;

      const app = React.createElement(
        HotkeysScope,
        {
          handlers: {
            [COMMAND.SELECT_ALL]: () => {
              selectAllCalls += 1;
            },
            [COMMAND.DESELECT]: () => {
              deselectCalls += 1;
            },
          },
          disabledCommands: [COMMAND.DESELECT],
          id: 'scope',
        },
        React.createElement('span', { id: 'child' }, 'content')
      );

      const container = document.getElementById('root');
      const root = createRoot(container);
      root.render(app);
      await new Promise((r) => setTimeout(r, 50));

      const scopeEl = document.getElementById('scope');
      assert.isOk(
        scopeEl,
        'HotkeysScope should render its wrapper element and forward passthrough props like id'
      );

      // react-hotkeys-hook's element-scoped mode only fires for a keydown
      // whose bubble path passes through the scoped element -- i.e. focus
      // must be on it or a descendant, same as the old Mousetrap-per-
      // instance-on-a-div behavior it replaces. In the real app this is
      // guaranteed by the app's own focus management (e.g. Patch focusing
      // its work area); a test has to do that explicitly.
      scopeEl.focus();

      const fireKey = (init) => {
        scopeEl.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            ...init,
          })
        );
      };

      // COMMAND.SELECT_ALL -> HOTKEY 'CmdOrCtrl+a' -> translated to 'mod+a'.
      // Setting both ctrlKey/metaKey covers whichever one 'mod' resolves to
      // on the platform running the test.
      fireKey({ code: 'KeyA', ctrlKey: true, metaKey: true });
      await new Promise((r) => setTimeout(r, 20));
      assert.strictEqual(
        selectAllCalls,
        1,
        'the bound SELECT_ALL handler should fire for its real hotkey combo'
      );

      // COMMAND.DESELECT -> HOTKEY 'escape', but listed in disabledCommands.
      fireKey({ code: 'Escape' });
      await new Promise((r) => setTimeout(r, 20));
      assert.strictEqual(
        deselectCalls,
        0,
        'a command listed in disabledCommands should never fire'
      );

      root.unmount();
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      delete global.window;
      delete global.document;
      delete global.Document;
      delete global.ShadowRoot;
    }
  });
});
