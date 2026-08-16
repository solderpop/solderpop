/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import { Root, initialState } from 'sdp-client';
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

ReactDOM.render(
  <Root
    extraReducers={extraReducers}
    extraMiddlewares={extraMiddlewares}
    initialState={initialState} // TODO: Remove project and opened patch when possible
  >
    <App />
  </Root>,
  document.getElementById('root')
);
