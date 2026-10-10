/* eslint-env browser */
import React from 'react';
import { createRoot } from 'react-dom/client';
import client, { Root, initialState } from 'sdp-client';
import App from './view/containers/App.jsx';

import popupsReducer from './popups/reducer.js';
import uploadReducer from './upload/reducer.js';

import stopDebuggerOnTabCloseMiddleware from './debugger/stopDebuggerOnTabCloseMiddleware.js';
import tetheringInetMiddleware from './debugger/tetheringInetMiddleware.js';
import sendToSerialMiddleware from './debugger/sendToSerialMiddleware.js';
import autoupdateMiddleware from './view/autoupdateMiddleware.js';
import installLibMiddleware from './view/installLibMiddleware.js';
import arduinoDependenciesMiddleware from './arduinoDependencies/middleware.js';
import emsdkInstallerMiddleware from './emsdkInstaller/middleware.js';

// Electron-only panel; its content comes from HOST_PANELS in App.jsx.
const initialStateWithVersionControl = {
  ...initialState,
  editor: {
    ...initialState.editor,
    panels: {
      ...initialState.editor.panels,
      [client.PANEL_IDS.VERSION_CONTROL]: {
        index: 2,
        maximized: false,
        sidebar: client.SIDEBAR_IDS.LEFT,
        size: 0.5,
      },
    },
  },
};

const extraReducers = {
  popups: popupsReducer,
  upload: uploadReducer,
};

const extraMiddlewares = [
  sendToSerialMiddleware,
  stopDebuggerOnTabCloseMiddleware,
  installLibMiddleware,
  autoupdateMiddleware,
  arduinoDependenciesMiddleware,
  emsdkInstallerMiddleware,
  tetheringInetMiddleware,
];

createRoot(document.getElementById('root')).render(
  <Root
    extraReducers={extraReducers}
    extraMiddlewares={extraMiddlewares}
    initialState={initialStateWithVersionControl} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>
);
