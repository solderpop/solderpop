/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'sdp-client';

import App from './containers/App.jsx';
import tutorialProject from '../tutorialProject.json';

if (process.env.WHY_DID_YOU_UPDATE) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import('why-did-you-update').then(({ whyDidYouUpdate }) => {
    whyDidYouUpdate(React);
  });
}

ReactDOM.render(
  <Root>
    <App tutorialProject={tutorialProject} />
  </Root>,
  document.getElementById('root')
);
