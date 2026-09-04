import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';

const { assert } = chai;

// react-contextmenu is abandoned (peer dep capped at react ^16.0.1) but its
// Trigger/Menu components turned out, on reading the source, to use none of
// React 19's removed/deprecated APIs: plain ES6 classes (no hooks, so the
// separate react@16 peer instance pnpm resolves for it can't cause an
// "Invalid hook call" cross-version bug), a `ref` callback (not
// findDOMNode) for positioning, and cross-component communication via a
// plain `window.dispatchEvent(new CustomEvent(...))`/`addEventListener`
// pair -- entirely React-version-agnostic. This test mounts a real
// Trigger+Menu pair under React 19 and fires an actual contextmenu event
// to confirm that holds up, rather than trusting the source-reading alone.
describe('react-contextmenu under React 19', () => {
  let ContextMenuTrigger;
  let ContextMenu;
  let MenuItem;

  before(async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;

    // react-contextmenu's globalEventListener module is a singleton
    // (`export default new GlobalEventListener()`) that binds
    // `window.addEventListener` as a side effect of being imported --
    // it has to see a real `window` at import time, so this dynamic
    // import (deferred until after the globals above are set) has to
    // replace the usual static `import ... from 'react-contextmenu'`.
    // Its CJS build also uses per-export getters that Node's ESM
    // `import { x }` can't statically detect (same interop issue
    // already hit with react-skylight) -- destructuring the resolved
    // module object at runtime works fine.
    const ReactContextMenu = (await import('react-contextmenu')).default;
    ({ ContextMenuTrigger, ContextMenu, MenuItem } = ReactContextMenu);
  });

  after(() => {
    delete global.window;
    delete global.document;
  });

  it('shows the menu and fires a MenuItem click after a real contextmenu event on the trigger', async () => {
    let itemClicked = false;

    const app = React.createElement(
      'div',
      null,
      React.createElement(
        ContextMenuTrigger,
        { id: 'test-menu' },
        React.createElement('div', { id: 'trigger' }, 'right-click me')
      ),
      React.createElement(
        ContextMenu,
        { id: 'test-menu' },
        React.createElement(
          MenuItem,
          {
            onClick: () => {
              itemClicked = true;
            },
          },
          'Do the thing'
        )
      )
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(app);
    await new Promise((r) => setTimeout(r, 50));

    const triggerEl = document.getElementById('trigger');
    const nav = document.querySelector('nav[role="menu"]');
    assert.isOk(triggerEl, 'the trigger content should be rendered');
    assert.isOk(nav, 'the ContextMenu should render its nav element');
    assert.notInclude(
      nav.className,
      'react-contextmenu--visible',
      'the menu should start hidden'
    );

    triggerEl.dispatchEvent(
      new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 10,
        clientY: 20,
      })
    );
    await new Promise((r) => setTimeout(r, 50));

    assert.include(
      document.querySelector('nav[role="menu"]').className,
      'react-contextmenu--visible',
      'a real contextmenu event on the trigger should show the menu'
    );

    const menuItemEl = document.querySelector(
      'nav[role="menu"] .react-contextmenu-item'
    );
    assert.isOk(menuItemEl, 'the MenuItem should be rendered inside the menu');

    menuItemEl.dispatchEvent(
      new window.MouseEvent('click', { bubbles: true, cancelable: true })
    );
    await new Promise((r) => setTimeout(r, 20));

    assert.isTrue(
      itemClicked,
      "clicking the rendered MenuItem should fire the item's onClick"
    );

    root.unmount();
    await new Promise((r) => setTimeout(r, 50));
    container.remove();
  });
});
