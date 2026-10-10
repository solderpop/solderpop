import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

import Menubar from '../src/utils/components/Menubar.jsx';

const { assert } = chai;

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('Menubar', () => {
  let dom;
  let root;
  let clicked;

  // React's onMouseEnter listens to the bubbling `mouseover`.
  const hover = (el) =>
    act(() => {
      el.dispatchEvent(
        new dom.window.MouseEvent('mouseover', {
          bubbles: true,
          relatedTarget: dom.window.document.body,
        })
      );
    });
  const click = (el) =>
    act(() => {
      el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
  const pressEscape = () =>
    act(() => {
      dom.window.dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key: 'Escape' })
      );
    });

  const $ = (sel) => dom.window.document.querySelector(sel);
  const titles = () => [
    ...dom.window.document.querySelectorAll(
      '.Menubar-root > .Menubar-submenu > .Menubar-submenu-title'
    ),
  ];
  const openTitles = () =>
    [
      ...dom.window.document.querySelectorAll(
        '.Menubar-submenu-open > .Menubar-submenu-title'
      ),
    ].map((el) => el.textContent);
  // Item text includes its hotkey hint, e.g. 'Ctrl+OOpen'.
  const itemByLabel = (label) =>
    [...dom.window.document.querySelectorAll('.Menubar-clickable-item')].find(
      (el) => el.textContent.endsWith(label)
    );

  beforeEach(async () => {
    dom = new JSDOM(
      '<!doctype html><html><body><div id="root"></div></body></html>'
    );
    global.window = dom.window;
    global.document = dom.window.document;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    clicked = [];

    const items = [
      {
        key: 'file',
        label: 'File',
        submenu: [
          {
            key: 'open',
            label: 'Open',
            hotkey: 'ctrl+o',
            click: () => clicked.push('open'),
          },
          { type: 'separator' },
          {
            key: 'recent',
            label: 'Recent',
            submenu: [
              { key: 'a', label: 'a.sdp', click: () => clicked.push('a') },
            ],
          },
          {
            key: 'locked',
            label: 'Locked',
            enabled: false,
            click: () => clicked.push('locked'),
          },
        ],
      },
      { key: 'edit', label: 'Edit', submenu: [{ key: 'undo', label: 'Undo' }] },
    ];

    root = createRoot($('#root'));
    await act(async () => {
      root.render(<Menubar items={items} />);
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    await tick();
    delete global.window;
    delete global.document;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  });

  it('opens a top-level menu on click, not on hover', () => {
    const [file] = titles();
    hover(file);
    assert.deepEqual(openTitles(), []);

    click(file);
    assert.deepEqual(openTitles(), ['File']);
    assert.isOk($('.MenuUnderlay.isVisible'));
  });

  it('switches menus on hover once one is open, and closes on second click', () => {
    const [file, edit] = titles();
    click(file);
    hover(edit);
    assert.deepEqual(openTitles(), ['Edit']);

    click(edit);
    assert.deepEqual(openTitles(), []);
  });

  it('opens nested submenus on hover and closes them when leaving', () => {
    click(titles()[0]);
    const recent = [
      ...document.querySelectorAll('.Menubar-submenu-title'),
    ].find((el) => el.textContent === 'Recent');
    hover(recent);
    assert.deepEqual(openTitles(), ['File', 'Recent']);

    hover(itemByLabel('Open'));
    assert.deepEqual(openTitles(), ['File']);
  });

  it('shows formatted hotkeys', () => {
    assert.strictEqual(itemByLabel('Open').textContent, 'Ctrl+OOpen');
  });

  it('runs the item click and closes the menu', () => {
    click(titles()[0]);
    click(itemByLabel('Open'));
    assert.deepEqual(clicked, ['open']);
    assert.deepEqual(openTitles(), []);
  });

  it('ignores clicks on disabled items', () => {
    click(titles()[0]);
    click(itemByLabel('Locked'));
    assert.deepEqual(clicked, []);
    assert.deepEqual(openTitles(), ['File']);
  });

  it('closes on Escape and keeps closed dropdowns mounted', () => {
    click(titles()[0]);
    pressEscape();
    assert.deepEqual(openTitles(), []);
    // Hidden, not unmounted: inputs inside items must survive closing.
    assert.isOk(itemByLabel('Open'));
    assert.isOk($('.Menubar-sub.Menubar-hidden'));
  });
});
