import * as R from 'ramda';
import * as client from 'sdp-client';

import { installEmsdk } from './runners';
import { installEmsdkProcess } from './actions';
import { formatErrorMessage, formatLogError } from '../view/formatError';

// sdp-deploy/src/progress.js's ProgressData uses `note`, not `message` —
// different from arduino-cli's own progress parser (parseProgressLog.js),
// which the equivalent adapter in ../arduinoDependencies/middleware.js is
// built for. installEmsdk's second step (emsdk's own stdout) has no
// percentage at all, which proc.progress already tolerates (debugger
// reducer only assigns it if present).
const progressToProcess = R.curry((processFn, progressData) => {
  processFn(progressData.note, progressData.percentage);
});

export default store => next => action => {
  if (
    action.type === client.MESSAGE_BUTTON_CLICKED &&
    action.payload === client.INSTALL_EMSDK_MSG
  ) {
    const proc = store.dispatch(installEmsdkProcess());
    installEmsdk(progressToProcess(proc.progress))
      .then(() => {
        store.dispatch(
          client.addNotification({
            title: 'Local Simulate installed',
            note: 'The Emscripten toolchain is ready — try Simulate again.',
            persistent: false,
          })
        );
        proc.success();
        // react-reflex (the Deployment panel's resizable-pane library)
        // mismeasures when the panel's content height changes abruptly —
        // here, the progress bar disappearing the instant install
        // completes — and gets stuck showing a collapsed/zero-height
        // panel until something forces it to recompute (a window resize,
        // or a full reload). Nudging it after the DOM settles is the
        // standard workaround; cheaper than chasing the library's
        // internal ResizeObserver logic.
        setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
      })
      .catch(err => {
        const snackbarError = formatErrorMessage(err);
        const logErr = formatLogError(err);
        store.dispatch(client.addError(snackbarError));
        proc.fail(logErr, 0);
      });
  }

  return next(action);
};
