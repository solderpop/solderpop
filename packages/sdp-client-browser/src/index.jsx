/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import { Root } from 'sdp-client';

import App from './containers/App.jsx';
import tutorialProject from '../tutorialProject.json';

if (process.env.WHY_DID_YOU_UPDATE) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import('@welldone-software/why-did-you-render').then(({ default: whyDidYouRender }) => {
    whyDidYouRender(React, { trackAllPureComponents: true });
  });
}

ReactDOM.render(
  <Root>
    <App tutorialProject={tutorialProject} />
  </Root>,
  document.getElementById('root')
);
