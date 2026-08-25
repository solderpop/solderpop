import * as client from 'sdp-client';
import { INSTALL_EMSDK } from '../shared/events.js';
import * as AT from './actionTypes.js';

// Reuses the plain string value 'INSTALL_EMSDK' as the process type —
// same trick ../arduinoDependencies/actions.js's `updatePackages` already
// relies on (it pulls UPGRADE_ARDUINO_DEPENDECIES from shared/events.js,
// not from sdp-client), since sdp-client/src/debugger/reducer.js's
// special-case switch matches on the string value alone.
export const installEmsdkProcess = client.createProcess(INSTALL_EMSDK);

export const requestManageLocalSimulation = () => ({
  type: AT.MANAGE_LOCAL_SIMULATION_REQUEST,
});
export const closeManageLocalSimulation = () => ({
  type: AT.MANAGE_LOCAL_SIMULATION_CLOSE,
});

export const closeWelcomeDialog = () => ({
  type: AT.WELCOME_POPUP_CLOSE,
});
export const firstLaunchDetected = () => ({
  type: AT.FIRST_LAUNCH_DETECTED,
});

// Triggers the same install flow the "Download & Install" snackbar's
// click would — see ./middleware.js, which intercepts this exact action
// regardless of what UI element dispatched it. Reused directly by
// WelcomeDialog and ManageLocalSimulationPopup's Install buttons instead
// of duplicating the check→process→progress→notify orchestration.
export const clickInstallEmsdk = () =>
  client.messageButtonClick(client.INSTALL_EMSDK_MSG);
