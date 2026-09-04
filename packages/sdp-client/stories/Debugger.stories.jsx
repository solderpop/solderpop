import React from 'react';
import { createStore as createReduxStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { action } from '@storybook/addon-actions';

import Debugger from '../src/debugger/containers/Debugger.jsx';
import DebuggerReducer from '../src/debugger/reducer.js';
import EditorReducer from '../src/editor/reducer.js';
import { getLogForCurrentTab } from '../src/debugger/selectors.js';
import {
  addMessagesToDebuggerLog,
  startDebuggerSession,
} from '../src/debugger/actions.js';

import '../src/core/styles/main.scss';

// =============================================================================
//
// Utils
//
// =============================================================================

const createStore = () =>
  createReduxStore(
    combineReducers({
      editor: EditorReducer,
      debugger: DebuggerReducer,
    })
  );

const addMessages = (store) => {
  const now = Date.now();
  store.dispatch(
    addMessagesToDebuggerLog([
      {
        type: 'log',
        message: `${now}: Just a simple log message, that readed from Serial`,
      },
      {
        type: 'log',
        message: `${now}: Just another log message`,
      },
      {
        type: 'xod',
        prefix: '+XOD',
        timecode: Date.now().toString(),
        nodeId: '32',
        content: 'Some text for watch node goes here!',
      },
      {
        type: 'xod',
        prefix: '+XOD',
        timecode: Date.now().toString(),
        nodeId: '12',
        content: (Math.random() * 1000 + Math.random()).toString(),
      },
    ])
  );
};

const addError = (store) => {
  store.dispatch(
    addMessagesToDebuggerLog([
      {
        type: 'error',
        message:
          'Error: Some error could be occured and displayed in the Debugger!',
        stack: 'And it could have a stack trace...',
      },
    ])
  );
};

const addUploadingLog = (store) => {
  store.dispatch({
    type: 'UPLOAD',
    meta: {
      status: 'started',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: 'Project was successfully transpiled. Searching for device...',
      percentage: 10,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message:
        'Port with connected Arduino was found. Installing toolchains...',
      percentage: 15,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });

  store.dispatch({
    type: 'UPLOAD',
    payload: {
      message: 'Toolchain is installed. Uploading...',
      percentage: 30,
      id: 1,
    },
    meta: {
      status: 'progressed',
    },
  });
};

const startDebugSession = (store) => {
  store.dispatch(
    startDebuggerSession(
      {
        type: 'system',
        message: 'Debug session has been started! (system message)',
      },
      {},
      {},
      {},
      '@/main'
    )
  );
};

// Container that shows Log length
const LogLength = connect((state) => ({ log: getLogForCurrentTab(state) }))(
  ({ log }) => <div style={{ color: '#fff' }}>Log length: {log.length}</div>
);

const withStore = (store) => [
  (Story) => (
    <Provider store={store}>
      <Story />
    </Provider>
  ),
];

const debuggerProps = {
  onUploadClick: action('onUploadClick'),
  onUploadAndDebugClick: action('onUploadAndDebugClick'),
  onRunSimulationClick: () => {},
  stopDebuggerSession: () => {},
};

// =============================================================================
//
// Stores, one per story (each needs its own pre-seeded state)
//
// =============================================================================

const idleStore = createStore();

const uploadingStore = createStore();
addUploadingLog(uploadingStore);

const uploadingSuccessStore = createStore();
addUploadingLog(uploadingSuccessStore);
uploadingSuccessStore.dispatch({
  type: 'UPLOAD',
  payload: {
    message:
      '\nConnecting to programmer: .\nFound programmer: Id = "CATERIN"; type = S\n    Software Version = 1.0; No Hardware Version given.\nProgrammer supports auto addr increment.\nProgrammer supports buffered memory access with buffersize=128 bytes.\n\nProgrammer supports the following devices:\n    Device code: 0x44\n\navrdude: AVR device initialized and ready to accept instructions\n\nReading | ################################################## | 100% 0.00s\n\navrdude: Device signature = 0x1e9587 (probably m32u4)\navrdude: reading input file "/Users/user/Library/Application Support/sdp-client-electron/upload-temp/build/sdp-arduino-sketch.cpp.hex"\navrdude: writing flash (6884 bytes):\n\nWriting | ################################################## | 100% 0.53s\n\navrdude: 6884 bytes of flash written\navrdude: verifying flash memory against /Users/user/Library/Application Support/sdp-client-electron/upload-temp/build/sdp-arduino-sketch.cpp.hex:\navrdude: load data flash data from input file /Users/user/Library/Application Support/sdp-client-electron/upload-temp/build/sdp-arduino-sketch.cpp.hex:\navrdude: input file /Users/user/Library/Application Support/sdp-client-electron/upload-temp/build/sdp-arduino-sketch.cpp.hex contains 6884 bytes\navrdude: reading on-chip flash data:\n\nReading | ################################################## | 100% 0.07s\n\navrdude: verifying ...\navrdude: 6884 bytes of flash verified\n\navrdude done.  Thank you.\n\n\n\n',
    id: 1,
  },
  meta: {
    status: 'succeeded',
  },
});

const uploadingFailStore = createStore();
addUploadingLog(uploadingFailStore);
uploadingFailStore.dispatch({
  type: 'UPLOAD',
  payload: {
    message: 'Error occured during uploading: Some horrible stuff happened',
    percentage: 30,
    id: 1,
  },
  meta: {
    status: 'failed',
  },
});

const runningStore = createStore();
startDebugSession(runningStore);
setInterval(() => addMessages(runningStore), 100);

const longMessagesStore = createStore();
const longMessagesErrorMessage = [
  'Error occured during uploading:',
  'Here goes some stacktrace with very long lines\n',
  'command /Users/user/xod/very-long-path/verylongpath/very-long-path/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/gcc',
  "can't find file /Users/user/xod/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/verylongpath/file.cpp",
].join('\n');
longMessagesStore.dispatch({
  type: 'UPLOAD',
  payload: {
    message: longMessagesErrorMessage,
    percentage: 30,
    id: 1,
  },
  meta: {
    status: 'failed',
  },
});
for (let i = 0; i < 100; i += 1) {
  addMessages(longMessagesStore);

  if (i % 10 === 0) {
    longMessagesStore.dispatch(
      addMessagesToDebuggerLog([
        {
          type: 'error',
          message: longMessagesErrorMessage,
          stack: 'And it could have a stack trace...',
        },
      ])
    );
  }
}

// =============================================================================
//
// Stories
//
// =============================================================================

export default { title: 'Debugger' };

export const Idle = {
  decorators: withStore(idleStore),
  render: () => <Debugger {...debuggerProps} />,
};

export const Uploading = {
  decorators: withStore(uploadingStore),
  render: () => <Debugger {...debuggerProps} />,
};

export const UploadingSuccess = {
  decorators: withStore(uploadingSuccessStore),
  render: () => <Debugger {...debuggerProps} />,
};

export const UploadingFail = {
  decorators: withStore(uploadingFailStore),
  render: () => <Debugger {...debuggerProps} />,
};

export const Running = {
  decorators: withStore(runningStore),
  render: () => (
    <div>
      <LogLength />
      <button onClick={() => addError(runningStore)}>Add error</button>
      <p />
      <Debugger {...debuggerProps} />
    </div>
  ),
};

export const LongMessages = {
  decorators: withStore(longMessagesStore),
  render: () => (
    <div>
      <LogLength />
      <Debugger {...debuggerProps} />
    </div>
  ),
};
