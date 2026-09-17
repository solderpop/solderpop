import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import ReactRcMenu from 'rc-menu';

const { assert } = chai;
// rc-menu's CJS build has the same named-export interop issue already hit
// with react-contextmenu/react-skylight (Node's ESM `import { x }` can't
// see its getter-based named exports) -- destructuring the default-
// imported module object at runtime works fine.
const { default: Menu, SubMenu, MenuItem } = ReactRcMenu;

// rc-menu (vendored) depends on rc-trigger for its non-inline submenu
// popups. rc-trigger 2.6.5 (rc-menu's original pin) calls
// ReactDOM.findDOMNode internally, fully removed in React 19 -- confirmed
// as a real build warning ("findDOMNode was not found in react-dom"),
// pointing straight at rc-menu's own SubMenu.js. Bumped rc-trigger to
// 5.3.4 (its own peer dep is react >=16.9.0, and its TriggerProps type
// still has every prop rc-menu's SubMenu.jsx passes -- action,
// onPopupVisibleChange, popup, builtinPlacements, popupPlacement,
// mouseEnterDelay/mouseLeaveDelay, getPopupContainer, forceRender,
// popupVisible -- confirmed by reading its actual .d.ts, not assumed).
// The build warning is gone after the bump; this test mounts a real
// horizontal Menu+SubMenu (matching Menubar.jsx's actual usage) and
// opens the submenu via a real mouseenter, to confirm the popup itself
// actually renders rather than just trusting a clean build log.
describe('rc-menu SubMenu popup (rc-trigger bump) under React 19', () => {
  it('renders the submenu popup content after a real mouseenter on the submenu title', async () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="root"></div></body></html>'
    );
    global.window = dom.window;
    global.document = dom.window.document;
    // rc-align (used by rc-trigger for popup positioning) checks
    // `instanceof Element` -- a real ambient global in browsers, but
    // jsdom only puts it on `window` (same class of gap already hit
    // with Document/ShadowRoot in the HotkeysScope test).
    global.Element = dom.window.Element;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;

    try {
      const app = React.createElement(
        Menu,
        { mode: 'horizontal' },
        React.createElement(
          SubMenu,
          { key: 'file', title: 'File' },
          React.createElement(MenuItem, { key: 'open' }, 'Open Project')
        )
      );

      const container = document.getElementById('root');
      const root = createRoot(container);
      root.render(app);
      await new Promise((r) => setTimeout(r, 50));

      const submenuTitle = document.querySelector('.rc-menu-submenu-title');
      assert.isOk(submenuTitle, 'the submenu title should be rendered');
      assert.isNull(
        document.querySelector('.rc-menu-submenu-popup .rc-menu-item'),
        'the popup content should not exist before the submenu opens'
      );

      // React's synthetic onMouseEnter is implemented on top of the
      // native (bubbling) `mouseover` event -- `mouseenter` itself
      // doesn't bubble, so React's delegated listener never sees it.
      submenuTitle.dispatchEvent(
        new window.MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        })
      );
      await new Promise((r) => setTimeout(r, 100));

      const openMenuItem = document.querySelector(
        '.rc-menu-submenu-popup .rc-menu-item'
      );
      assert.isOk(
        openMenuItem,
        'a real mouseenter on the submenu title should render the popup content (no findDOMNode crash)'
      );
      assert.include(openMenuItem.textContent, 'Open Project');

      root.unmount();
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      delete global.window;
      delete global.document;
      delete global.Element;
      delete global.HTMLElement;
      delete global.Node;
    }
  });
});
