import * as UserSelectors from './user/selectors.js';
import * as EditorSelectors from './editor/selectors.js';
import * as ProcessSelectors from './processes/selectors.js';
import * as ProjectSelectors from './project/selectors.js';
import * as PopupSelectors from './popups/selectors.js';
import * as DebuggerSelectors from './debugger/selectors.js';
import * as MessageSelectors from './messages/selectors.js';
import { hasUnsavedChanges, getLastSavedProject } from './core/selectors.js';

import * as CoreActions from './core/actions.js';
import * as EditorActions from './editor/actions.js';
import * as ProjectActions from './project/actions.js';
import * as MessageActions from './messages/actions.js';
import * as ProcessActions from './processes/actions.js';
import * as ProjectBrowserActions from './projectBrowser/actions.js';
import * as PopupActions from './popups/actions.js';
import * as DebuggerActions from './debugger/actions.js';
import * as ThemeActions from './theme/actions.js';
import * as ThemeActionTypes from './theme/actionTypes.js';
import * as ThemeSelectors from './theme/selectors.js';

import {
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
  SERIAL_SESSION_STARTED,
  LINE_SENT_TO_SERIAL,
  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUG_SESSION_STARTED,
  TETHERING_INET_CREATED,
} from './debugger/actionTypes.js';

import { LOG_TAB_TYPE } from './debugger/constants.js';
import { getTetheringInetNodeId } from './debugger/utils.js';

import { MESSAGE_BUTTON_CLICKED } from './messages/actionTypes.js';
import {
  TAB_CLOSE,
  INSTALL_LIBRARIES_COMPLETE,
  TWEAK_PULSE_SENT,
  NODE_PROPERTY_UPDATING,
  SIMULATION_LAUNCHED,
} from './editor/actionTypes.js';
import { SAVE_ALL, NODE_PROPERTY_UPDATED } from './project/actionTypes.js';

import * as EditorConstants from './editor/constants.js';
import * as UtilsConstants from './utils/constants.js';
import * as PopupConstants from './popups/constants.js';

import popupsReducer, {
  showOnlyPopup,
  hideOnePopup,
} from './popups/reducer.js';

import * as siteLinkUtils from './utils/urls.js';
import * as BrowserUtils from './utils/browser.js';
import * as MenuUtils from './utils/menu.js';
import sanctuaryPropType from './utils/sanctuaryPropType.js';
import * as urlActions from './core/urlActions.js';
import * as coreMessages from './core/messages.js';

import App from './core/containers/App.jsx';
import Root from './core/containers/Root.jsx';
import { container as Editor } from './editor/index.js';
import SnackBar from './messages/index.js';
import composeMessage from './messages/composeMessage.js';
import * as MessageConstants from './messages/constants.js';
import Toolbar from './utils/components/Toolbar.jsx';
import SolderpopLogo from './utils/components/SolderpopLogo.jsx';
import SolderpopLockup from './utils/components/SolderpopLockup.jsx';
import PopupShowCode from './utils/components/PopupShowCode.jsx';
import PopupAlert from './utils/components/PopupAlert.jsx';
import PopupConfirm from './utils/components/PopupConfirm.jsx';
import PopupPrompt from './utils/components/PopupPrompt.jsx';
import PopupForm from './utils/components/PopupForm.jsx';

import PopupProjectPreferences from './project/components/PopupProjectPreferences.jsx';

import {
  createLogMessage,
  createSystemMessage,
  isXodMessage,
  createXodMessage,
  createErrorMessage,
  parseDebuggerMessage,
} from './debugger/debugProtocol.js';

import initialState from './core/state.js';
import { default as deriveProjectName } from './utils/deriveProjectName.js';

import themeReducer from './theme/reducer.js';
import { INITIAL_STATE as themeInitialState } from './theme/state.js';
import ThemeSettingsPopup from './theme/components/ThemeSettingsPopup.jsx';

export { default as ThemeSettingsPopup } from './theme/components/ThemeSettingsPopup.jsx';

export * from './editor/actions.js';
export * from './project/actions.js';
export * from './messages/actions.js';
export * from './processes/actions.js';
export * from './projectBrowser/actions.js';
export * from './popups/actions.js';
export * from './debugger/actions.js';
export {
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
  SERIAL_SESSION_STARTED,
  LINE_SENT_TO_SERIAL,
  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUG_SESSION_STARTED,
  TETHERING_INET_CREATED,
} from './debugger/actionTypes.js';

export { LOG_TAB_TYPE } from './debugger/constants.js';
export { getTetheringInetNodeId } from './debugger/utils.js';

export { MESSAGE_BUTTON_CLICKED } from './messages/actionTypes.js';
export {
  TAB_CLOSE,
  INSTALL_LIBRARIES_COMPLETE,
  NODE_PROPERTY_UPDATING,
  SIMULATION_LAUNCHED,
} from './editor/actionTypes.js';
export { TWEAK_PULSE_SENT };
export { SAVE_ALL, NODE_PROPERTY_UPDATED } from './project/actionTypes.js';

export * from './editor/selectors.js';
export * from './project/selectors.js';
export * from './popups/selectors.js';
export * from './debugger/selectors.js';
export { hasUnsavedChanges, getLastSavedProject } from './core/selectors.js';

export * from './utils/browser.js';
export * from './utils/constants.js';
export * from './utils/urls.js';
export * from './popups/constants.js';
export { lowercaseKebabMask } from './utils/inputFormatting.js';
export { default as sanctuaryPropType } from './utils/sanctuaryPropType.js';
export * from './core/urlActions.js';
export const Messages = coreMessages;

export { default as PopupShowCode } from './utils/components/PopupShowCode.jsx';
export { default as PopupAlert } from './utils/components/PopupAlert.jsx';
export { default as PopupConfirm } from './utils/components/PopupConfirm.jsx';
export { default as PopupPrompt } from './utils/components/PopupPrompt.jsx';
export { default as PopupForm } from './utils/components/PopupForm.jsx';
export { default as Toolbar } from './utils/components/Toolbar.jsx';
export { default as SolderpopLogo } from './utils/components/SolderpopLogo.jsx';
export { default as SolderpopLockup } from './utils/components/SolderpopLockup.jsx';
export { default as PopupProjectPreferences } from './project/components/PopupProjectPreferences.jsx';

export { default as App } from './core/containers/App.jsx';
export { default as Root } from './core/containers/Root.jsx';
export { container as Editor } from './editor/index.js';
export { default as SnackBar } from './messages/index.js';
export { default as composeMessage } from './messages/composeMessage.js';
export * from './messages/constants.js';
export * from './messages/selectors.js';

export { default as initialState } from './core/state.js';

export { default as deriveProjectName } from './utils/deriveProjectName.js';

export {
  createLogMessage,
  isXodMessage,
  createXodMessage,
  createErrorMessage,
  parseDebuggerMessage,
} from './debugger/debugProtocol.js';

export {
  default as popupsReducer,
  showOnlyPopup,
  hideOnePopup,
} from './popups/reducer.js';

export default {
  App,
  Root,
  Editor,
  PopupShowCode,
  PopupAlert,
  PopupConfirm,
  PopupPrompt,
  PopupForm,
  SnackBar,
  Toolbar,
  menu: MenuUtils,
  sanctuaryPropType,
  initialState,
  popupsReducer,
  showOnlyPopup,
  hideOnePopup,
  PopupProjectPreferences,
  hasUnsavedChanges,
  getLastSavedProject,
  composeMessage,
  createLogMessage,
  createSystemMessage,
  isXodMessage,
  createXodMessage,
  createErrorMessage,
  parseDebuggerMessage,
  deriveProjectName,
  getTetheringInetNodeId,
  TAB_CLOSE,
  SAVE_ALL,
  NODE_PROPERTY_UPDATED,
  NODE_PROPERTY_UPDATING,
  TWEAK_PULSE_SENT,
  INSTALL_LIBRARIES_COMPLETE,
  MESSAGE_BUTTON_CLICKED,
  Messages: coreMessages,
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
  SERIAL_SESSION_STARTED,
  LINE_SENT_TO_SERIAL,
  LOG_TAB_TYPE,
  SIMULATION_LAUNCHED,
  DEBUGGER_LOG_ADD_MESSAGES,
  DEBUG_SESSION_STARTED,
  TETHERING_INET_CREATED,
  theme: {
    actions: ThemeActions,
    actionTypes: ThemeActionTypes,
    selectors: ThemeSelectors,
    reducer: themeReducer,
    state: themeInitialState,
    components: { ThemeSettingsPopup },
  },
  ThemeSettingsPopup,
  SolderpopLogo,
  SolderpopLockup,
  ...UserSelectors,
  ...EditorSelectors,
  ...ProcessSelectors,
  ...ProjectSelectors,
  ...PopupSelectors,
  ...DebuggerSelectors,
  ...MessageSelectors,

  ...CoreActions,
  ...EditorActions,
  ...ProjectActions,
  ...MessageActions,
  ...ProcessActions,
  ...ProjectBrowserActions,
  ...PopupActions,
  ...DebuggerActions,
  ...ThemeActions,
  ...ThemeSelectors,

  ...EditorConstants,
  ...MessageConstants,
  ...UtilsConstants,
  ...BrowserUtils,
  ...PopupConstants,

  ...siteLinkUtils,
  ...urlActions,
};
