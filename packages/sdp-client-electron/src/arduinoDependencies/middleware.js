import R from 'ramda';
import * as client from 'sdp-client';
import { foldMaybe } from 'sdp-func-tools';
import { messages as xdbMessages } from 'sdp-deploy-bin';
import { INSTALL_ARDUINO_DEPENDENCIES_MSG } from './constants.js';
import {
  installArduinoDependencies,
  updateArduinoPackages,
} from './runners.js';
import { installDeps, updatePackages } from './actions.js';
import { ARDUPACKAGES_UPGRADE_PROCEED } from './actionTypes.js';
import getLibraryNames from './getLibraryNames.js';

import { formatErrorMessage, formatLogError } from '../view/formatError.js';

const progressToProcess = R.curry((processFn, progressData) => {
  processFn(progressData.message, progressData.percentage);
});

export default (store) => (next) => (action) => {
  if (
    action.type === client.MESSAGE_BUTTON_CLICKED &&
    action.payload === INSTALL_ARDUINO_DEPENDENCIES_MSG
  ) {
    const state = store.getState();
    const maybeData = client.getMessageDataById(
      INSTALL_ARDUINO_DEPENDENCIES_MSG,
      state
    );

    foldMaybe(
      null,
      ({ libraries, packages, packageNames }) => {
        const proc = store.dispatch(installDeps());
        installArduinoDependencies(progressToProcess(proc.progress), {
          libraries,
          packages,
        })
          .then(() => {
            store.dispatch(
              client.addNotification(
                // eslint-disable-next-line new-cap
                xdbMessages.ARDUINO_DEPENDENCIES_INSTALLED({
                  libraryNames: getLibraryNames(libraries),
                  packageNames,
                })
              )
            );
            proc.success();
          })
          .catch((err) => {
            const snackbarError = formatErrorMessage(err);
            const logErr = formatLogError(err);
            store.dispatch(client.addError(snackbarError));
            proc.fail(logErr, 0);
          });
      },
      maybeData
    );
  }

  if (action.type === ARDUPACKAGES_UPGRADE_PROCEED) {
    const proc = store.dispatch(updatePackages());
    updateArduinoPackages(progressToProcess(proc.progress))
      .then(() => {
        store.dispatch(
          client.addNotification(
            // eslint-disable-next-line new-cap
            xdbMessages.ARDUINO_PACKAGES_UPDATED()
          )
        );
        proc.success();
      })
      .catch((err) => {
        const snackbarError = formatErrorMessage(err);
        const logErr = formatLogError(err);
        store.dispatch(client.addError(snackbarError));
        proc.fail(logErr, 0);
      });
  }

  return next(action);
};
