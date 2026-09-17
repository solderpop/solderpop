import {
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
  indentUnit,
} from '@codemirror/language';
import { cpp } from '@codemirror/legacy-modes/mode/clike';
import {
  EditorView,
  keymap,
  highlightTrailingWhitespace,
} from '@codemirror/view';
import { indentMore, indentLess, toggleComment } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import { tags as t } from '@lezer/highlight';

const XOD_TYPE_NAMES =
  /(Number|NodeId|Context|DirtyFlags|TimeMs|u?int\d{1,2}_t|size_t|XString|State|List|Iterator|(typeof_[A-Za-z0-9_]+))\b/;
const XOD_KEYWORDS = /\b(node|meta)\b/;
const XOD_BUILTIN_NAMES =
  /(getValue|emitValue|isInputDirty|transactionTime|setTimeout|clearTimeout|isTimedOut|setImmediate|evaluate|getState|raiseError|isSettingUp|getError|(constant_(input|output)_[A-Za-z0-9_]+))\b/;
const ARDUINO_BUILTIN_NAMES =
  /((digital|analog)(Read|Write)|pinMode|analogReference)\b/;
const XOD_TAG_NAMES = /(((input|output)_[A-Za-z0-9_]+)|GENERATED_CODE)\b/;

// A word boundary immediately before one of the patterns above, so plain
// variables that merely contain these names (e.g. `myNumber`, `agetValue`)
// don't get misidentified.
const XOD_RULES = [
  [XOD_TAG_NAMES, 'tag'],
  [XOD_TYPE_NAMES, 'type'],
  [XOD_BUILTIN_NAMES, 'builtin'],
  [ARDUINO_BUILTIN_NAMES, 'builtin'],
  [XOD_KEYWORDS, 'keyword'],
];

// Tries each XOD-specific rule at the current stream position (only at a
// word boundary, so it can't fire mid-identifier); falls through to the
// C++ tokenizer for everything else. Direct port of the CM5 version's
// CodeMirror.simpleMode + CodeMirror.overlayMode(cpp) pair -- CM6 has no
// overlay-mode concept, so this recreates the same "XOD patterns take
// priority, C++ handles the rest" behavior as one combined tokenizer.
const xodCppTokenizer = {
  token(stream, state) {
    if (stream.sol() || /\W/.test(stream.string.charAt(stream.pos - 1))) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [regex, tokenName] of XOD_RULES) {
        if (stream.match(regex)) return tokenName;
      }
    }
    return cpp.token(stream, state);
  },
  startState: cpp.startState,
  blankLine: cpp.blankLine,
  copyState: cpp.copyState,
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
  },
};

export const xodCppLanguage = StreamLanguage.define(xodCppTokenizer);

const xodHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#e67cdc' },
  { tag: t.typeName, color: '#fff0a3' },
  { tag: t.standard(t.variableName), color: '#7b8db5' },
  { tag: t.definition(t.variableName), color: '#7b8db5' },
  { tag: t.tagName, color: '#4fd4c8' },
  { tag: t.string, color: '#fff0a3' },
  { tag: t.number, color: '#fd6161' },
  { tag: t.comment, color: '#a9b4bd' },
  { tag: t.variableName, color: '#c7cfd6' },
  { tag: t.meta, color: '#2ec4b6' },
]);

const xodEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#2f4356',
      color: '#eef1f3',
      fontFamily: "'Roboto Mono', monospace",
      fontSize: '12px',
      height: '100%',
    },
    '.cm-content': { caretColor: '#fff' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#fff' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    '.cm-gutters': {
      backgroundColor: '#2f4356',
      color: '#2ec4b6',
      border: 'none',
    },
    '.cm-activeLineGutter, .cm-activeLine': {
      backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      textDecoration: 'underline',
      color: 'white !important',
    },
    '.cm-trailingSpace': {
      backgroundColor: 'transparent',
      borderBottom: '1px dotted #c33d3d',
    },
  },
  { dark: true }
);

// Clears whitespace-only lines directly above the cursor when Enter is
// pressed -- e.g. to tidy up a leading quote just added before the
// literal. Runs before the default Enter handling (returns false so
// insertNewlineAndIndent still runs after).
const clearEmptyLinesAbove = (view) => {
  const { state } = view;
  const cursorLine = state.doc.lineAt(state.selection.main.head);
  const changes = [];
  for (
    let lineNumber = cursorLine.number - 1;
    lineNumber >= 1;
    lineNumber -= 1
  ) {
    const line = state.doc.line(lineNumber);
    if (/\S/.test(line.text)) break;
    if (line.text.length > 0) {
      changes.push({ from: line.from, to: line.to, insert: '' });
    }
  }
  if (changes.length > 0) view.dispatch({ changes });
  return false;
};

const xodTabBehavior = (view) => {
  const { state } = view;
  const { main } = state.selection;
  if (!main.empty) {
    const selectedText = state.sliceDoc(main.from, main.to);
    const line = state.doc.lineAt(main.from);
    if (selectedText.includes('\n') || selectedText.length === line.length) {
      return indentMore(view) || true;
    }
  }
  // Soft tab: insert spaces up to the configured indent unit, not a
  // literal tab character -- @codemirror/commands' own insertTab always
  // inserts "\t", with no unit-aware alternative built in.
  view.dispatch(
    state.update(state.replaceSelection(state.facet(indentUnit)), {
      scrollIntoView: true,
      userEvent: 'input',
    })
  );
  return true;
};

// Exported unwrapped so its `run` functions can be exercised directly
// against `EditorState.update()` in tests, without needing a real
// EditorView (which needs DOM Selection/ResizeObserver support this
// repo's headless test environment doesn't have).
export const xodKeyBindings = [
  { key: 'Enter', run: clearEmptyLinesAbove },
  { key: 'Tab', run: xodTabBehavior },
  { key: 'Shift-Tab', run: indentLess },
  { key: 'Mod-/', run: toggleComment },
];

export const xodKeymap = Prec.highest(keymap.of(xodKeyBindings));

export const xodExtensions = [
  xodCppLanguage,
  indentUnit.of('    '),
  syntaxHighlighting(xodHighlightStyle),
  xodEditorTheme,
  highlightTrailingWhitespace(),
  xodKeymap,
];
