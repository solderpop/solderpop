import userState from '../user/state.js';
import editorState from '../editor/state.js';
import projectState from '../project/state.js';
import debuggerState from '../debugger/state.js';
import projectBrowserState from '../projectBrowser/state.js';
import hintingState from '../hinting/state.js';
import { INITIAL_STATE as themeState } from '../theme/state.js';

export default {
  user: userState,
  project: projectState,
  projectHistory: {},
  projectBrowser: projectBrowserState,
  editor: editorState,
  debugger: debuggerState,
  errors: {},
  processes: {},
  lastSavedProject: projectState,
  hinting: hintingState,
  theme: themeState,
};
