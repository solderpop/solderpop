import { compose, applyMiddleware } from 'redux';
import thunkModule from 'redux-thunk';

import resolveLibsMiddleware from '../project/resolveLibsMiddleware.js';
import devtoolsMiddleware from '../utils/devtoolsMiddleware.js';
import sidebarsMiddleware from '../editor/sidebarsMiddleware.js';
import crashReporter from './crashReporterMiddleware.js';
import hintingMiddleware from '../hinting/middleware.js';
import domSideeffectsMiddleware from './domSideeffectsMiddleware.js';
import outdaterMiddleware from '../debugger/outdaterMiddleware.js';
import sendToSimulationSerialMiddleware from '../debugger/sendToSimulationSerialMiddleware.js';
import stopSimulationMiddleware from '../editor/stopSimulationMiddleware.js';

const thunk =
  typeof thunkModule === 'function' ? thunkModule : thunkModule.default;

export default (extraMiddlewares = []) =>
  compose(
    applyMiddleware(
      crashReporter,
      thunk,
      resolveLibsMiddleware,
      sidebarsMiddleware,
      hintingMiddleware,
      domSideeffectsMiddleware,
      outdaterMiddleware,
      stopSimulationMiddleware,
      sendToSimulationSerialMiddleware,
      ...extraMiddlewares
    ),
    devtoolsMiddleware
  );
