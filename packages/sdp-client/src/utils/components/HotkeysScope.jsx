import React from 'react';
import PropTypes from 'prop-types';
import { useHotkeys } from 'react-hotkeys-hook';

import { COMMAND, HOTKEY } from '../constants.js';

const ALL_COMMANDS = Object.values(COMMAND);

// react-hotkeys-hook's modifier vocabulary is shift/alt/meta/mod/ctrl/control
// -- `HOTKEY`'s combo strings use Mousetrap's ('CmdOrCtrl', 'del'), so
// translate the two tokens that differ. 'mod' is react-hotkeys-hook's own
// cross-platform Cmd-or-Ctrl modifier, replacing the old manual OS branching.
const translateToken = (token) => {
  const lower = token.toLowerCase();
  if (lower === 'cmdorctrl') return 'mod';
  if (lower === 'del') return 'delete';
  return token;
};

const translateCombo = (raw) =>
  (Array.isArray(raw) ? raw : [raw]).map((combo) =>
    combo.split('+').map(translateToken).join('+')
  );

// A combo no real KeyboardEvent will ever produce, for commands with no
// `HOTKEY` entry -- kept disabled via `enabled: false` below regardless.
const UNBOUND_COMBO = '$$unbound$$';

/**
 * Replacement for react-hotkeys v1's `<HotKeys keyMap handlers>` (removed:
 * it calls `ReactDOM.findDOMNode`, gone in React 19). Preserves the same
 * COMMAND-name indirection: callers pass `{ [COMMAND.X]: handler }` and the
 * actual key combo comes from `HOTKEY[COMMAND.X]`, resolved here.
 *
 * Registers one `useHotkeys` call per entry in the app's whole `COMMAND`
 * enum, every render, unconditionally -- `COMMAND` is a static import that
 * never changes shape, so this is a fixed-length, fixed-order set of hook
 * calls (Rules of Hooks only forbids a call count/order that *varies*
 * between renders of the same component). Each call is individually
 * gated by its own `enabled` option instead, matching the fact that
 * `handlers` and `disabledCommands` differ per render/caller.
 *
 * Scoped to this component's own wrapper element (like the old per-instance
 * Mousetrap binding), not the whole document, by attaching every hook's
 * returned ref callback to that element.
 */
function HotkeysScope({ handlers, disabledCommands, children, ...rest }) {
  const refCallbacks = ALL_COMMANDS.map((command) =>
    useHotkeys(
      HOTKEY[command] ? translateCombo(HOTKEY[command]) : UNBOUND_COMBO,
      (event, hotkeysEvent) => {
        const handler = handlers[command];
        if (handler) handler(event, hotkeysEvent);
      },
      {
        enabled: Boolean(handlers[command]) && !disabledCommands.includes(command),
        // The app's own handlers already guard against firing while
        // typing (see `isInputTarget` checks) -- don't let the library's
        // own form-tag filtering additionally suppress them.
        enableOnFormTags: true,
      }
    )
  );

  return (
    <div
      tabIndex={-1}
      ref={(node) => {
        refCallbacks.forEach((ref) => ref(node));
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

HotkeysScope.propTypes = {
  handlers: PropTypes.objectOf(PropTypes.func).isRequired,
  disabledCommands: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
};

HotkeysScope.defaultProps = {
  disabledCommands: [],
  children: null,
};

export default HotkeysScope;
