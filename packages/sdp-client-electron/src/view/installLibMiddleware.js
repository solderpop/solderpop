import client from 'sdp-client';
import electron from 'electron';

import { INSTALL_LIBRARIES } from '../shared/events.js';

const { ipcRenderer } = electron;

export default () => (next) => (action) => {
  if (action.type === client.INSTALL_LIBRARIES_COMPLETE) {
    ipcRenderer.send(INSTALL_LIBRARIES, {
      request: action.payload.request,
      projects: action.payload.projects,
    });
  }

  return next(action);
};
