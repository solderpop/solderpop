import { ipcRenderer } from 'electron';
import { GIT_CALL } from '../shared/events.js';

// Runs an sdp-git operation in the main process (see app/gitActions.js).
export default async function callGit(method, payload = {}) {
  const result = await ipcRenderer.invoke(GIT_CALL, { method, payload });
  if (!result.ok) {
    throw Object.assign(new Error(result.error.message), result.error);
  }
  return result.value;
}
