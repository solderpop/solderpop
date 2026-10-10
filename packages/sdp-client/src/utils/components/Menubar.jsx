import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';

// Desktop-style menubar: click a top-level title to open it, then hover
// moves between menus and into nested submenus. Replaces the vendored
// rc-menu 6.2.3, which relied on legacy context removed in React 19.

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function formatHotkey(hotkeys) {
  if (Array.isArray(hotkeys)) {
    return hotkeys.map(formatHotkey).join(', ');
  }

  return hotkeys.split('+').map(capitalize).join('+');
}

// `path` lists the keys of the open submenus, top-level first. Keys are
// only unique among siblings, so a submenu is open when its whole path
// is a prefix of the open path.
const isPrefixOf = (path, openPath) =>
  path.length <= openPath.length && path.every((k, i) => openPath[i] === k);

const noop = () => {};

function Menubar({ items = [] }) {
  const [openPath, setOpenPath] = useState([]);
  const isOpen = openPath.length > 0;

  const closeAll = useCallback(() => setOpenPath([]), []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeAll]);

  const renderItems = (list, parentPath) =>
    list.map((item, index) => {
      const {
        key = index, // menu items are never rearranged, so indices are stable
        type,
        submenu,
        enabled = true,
        click = noop,
        children,
        label,
        hotkey,
      } = item;
      const id = String(key);

      if (type === 'separator') {
        return (
          <li key={id} className="Menubar-item-divider" role="separator" />
        );
      }

      if (Array.isArray(submenu)) {
        const path = [...parentPath, id];
        const isTopLevel = parentPath.length === 0;
        const isSubmenuOpen = isPrefixOf(path, openPath);

        const onTitleClick = () => {
          if (!enabled) {
            return;
          }

          if (isTopLevel && isSubmenuOpen) {
            closeAll();
            return;
          }

          setOpenPath(path);
        };
        const onTitleHover = () => {
          // Top-level menus open on click; once one is open, hover switches.
          if (enabled && (isOpen || !isTopLevel)) {
            setOpenPath(path);
          }
        };

        return (
          <li
            key={id}
            className={cn(
              'Menubar-submenu',
              isTopLevel
                ? 'Menubar-submenu-horizontal'
                : 'Menubar-submenu-vertical',
              {
                'Menubar-submenu-open': isSubmenuOpen,
                'Menubar-submenu-disabled': !enabled,
              }
            )}
          >
            <div
              className="Menubar-submenu-title"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isSubmenuOpen}
              aria-disabled={!enabled}
              onClick={onTitleClick}
              onMouseEnter={onTitleHover}
            >
              <span>{label}</span>
            </div>
            {/* Always mounted, only hidden: items may hold inputs (e.g. the
                browser's file picker) that must outlive the menu closing. */}
            <ul
              className={cn('Menubar', 'Menubar-sub', 'Menubar-vertical', {
                'Menubar-hidden': !isSubmenuOpen,
              })}
              role="menu"
            >
              {renderItems(submenu, path)}
            </ul>
          </li>
        );
      }

      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <li
          key={id}
          className={cn('Menubar-item', { 'Menubar-item-disabled': !enabled })}
          role="menuitem"
          aria-disabled={!enabled}
          onClick={enabled ? closeAll : undefined}
          onMouseEnter={() => setOpenPath(parentPath)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            onClick={enabled ? click : undefined}
            className="Menubar-clickable-item"
          >
            {hotkey && <div className="hotkey">{formatHotkey(hotkey)}</div>}
            {children || label}
          </div>
        </li>
      );
    });

  return (
    <>
      <ul className="Menubar Menubar-root Menubar-horizontal" role="menubar">
        {renderItems(items, [])}
      </ul>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={cn('MenuUnderlay', { isVisible: isOpen })}
        onClick={closeAll}
      />
    </>
  );
}

// a trick to make recursive propType.
// see https://github.com/facebook/react/issues/5676
let menuBarItemType;
const lazyMenuBarItemType = (...args) => menuBarItemType(...args);

menuBarItemType = PropTypes.shape({
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  children: PropTypes.element,
  type: PropTypes.oneOf(['separator']),
  submenu: PropTypes.arrayOf(lazyMenuBarItemType),
  enabled: PropTypes.bool,
  click: PropTypes.func,
  hotkey: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
});

export const itemsPropTypes = PropTypes.arrayOf(menuBarItemType);

Menubar.propTypes = {
  items: itemsPropTypes,
};

export default Menubar;
