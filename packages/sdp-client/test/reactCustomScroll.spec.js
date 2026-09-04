import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';

const { assert } = chai;

// react-custom-scroll (a xodio git fork) called ReactDOM.findDOMNode in
// three places -- isMouseEventOnCustomScrollbar/calculateNewScrollHandleTop
// (findDOMNode(this), for the component's own root) and
// isMouseEventOnScrollHandle (findDOMNode(this.scrollHandle), where
// scrollHandle is already a real DOM node saved via its own setRefElement
// ref helper -- findDOMNode on an already-DOM-node argument was always
// redundant there). Patched via `pnpm patch` to save a `rootDomNode` ref
// on the component's own outer div (reusing the same setRefElement
// helper it already uses for scrollHandle/innerContainer/contentWrapper)
// and use that/the already-real scrollHandle node directly instead.
describe('react-custom-scroll under React 19', () => {
  let CustomScroll;

  before(async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;

    // The package's UMD wrapper (`!function(e,t){...}(window, ...)`)
    // reads `window` as a module-load-time side effect -- a static
    // top-level import would run before the globals above are set, so
    // this dynamic import (deferred until after) is required, same as
    // the HotkeysScope test's globalEventListener situation.
    CustomScroll = (await import('react-custom-scroll')).default;
  });

  after(() => {
    delete global.window;
    delete global.document;
  });

  it('mounts, and a mousedown on the scrollbar track does not crash on the removed ReactDOM.findDOMNode', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      const app = React.createElement(
        CustomScroll,
        {},
        React.createElement('div', { style: { height: 2000 } }, 'tall content')
      );

      root.render(app);
      await new Promise((r) => setTimeout(r, 50));

      const outerContainer = document.querySelector(
        '.custom-scroll .outer-container'
      );
      assert.isOk(outerContainer, 'the outer container should be rendered');

      // jsdom computes no real layout, so getBoundingClientRect is always
      // zeroed -- stub it (same workaround used for the react-dnd test)
      // so the position-math methods that used to call findDOMNode have
      // something non-degenerate to work with.
      const stubRect = () => ({
        left: 0,
        right: 100,
        top: 0,
        bottom: 300,
        width: 100,
        height: 300,
      });
      document
        .querySelectorAll(
          '.custom-scroll, .custom-scrollbar, .custom-scroll-handle'
        )
        .forEach((el) => {
          Object.assign(el, { getBoundingClientRect: stubRect });
        });

      // Force the "has a scrollbar" branch (normally driven by real
      // scrollHeight/clientHeight, both always 0 in jsdom) so the
      // scrollbar-track/handle DOM this test needs actually renders.
      root.render(
        React.createElement(
          CustomScroll,
          { scrollTo: 1 },
          React.createElement(
            'div',
            { style: { height: 2000 } },
            'tall content'
          )
        )
      );
      await new Promise((r) => setTimeout(r, 50));

      // A mousedown anywhere on the outer container is what
      // isMouseEventOnCustomScrollbar/isMouseEventOnScrollHandle (the
      // methods that used findDOMNode) run on every time, scrollbar
      // visible or not -- this alone previously threw immediately.
      outerContainer.dispatchEvent(
        new window.MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 10,
          clientY: 10,
        })
      );
      await new Promise((r) => setTimeout(r, 20));

      // Reaching here at all (no uncaught exception) is the actual
      // assertion -- the old code crashed synchronously inside the
      // onMouseDown handler.
      assert.isOk(true, 'mousedown handling completed without throwing');

      root.unmount();
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      container.remove();
    }
  });
});
