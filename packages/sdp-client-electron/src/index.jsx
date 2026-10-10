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
import { electronThemeStorage, loadThemeState } from './view/themeStorage.ts';

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
  client.theme.createThemePersistenceMiddleware(electronThemeStorage),
];

createRoot(document.getElementById('root')).render(
  <Root
    extraReducers={extraReducers}
    extraMiddlewares={extraMiddlewares}
    initialState={{ ...initialState, theme: loadThemeState() }} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>
);
