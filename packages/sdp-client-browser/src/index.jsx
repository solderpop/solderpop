/* eslint-env browser */

import React from 'react';
import { createRoot } from 'react-dom/client';
import client, { Root, initialState } from 'sdp-client';

import App from './containers/App.jsx';
import tutorialProject from '../tutorialProject.json';
import { browserThemeStorage, loadThemeState } from './themeStorage.ts';

if (process.env.WHY_DID_YOU_UPDATE) {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import('@welldone-software/why-did-you-render').then(({ default: whyDidYouRender }) => {
    whyDidYouRender(React, { trackAllPureComponents: true });
  });
}

createRoot(document.getElementById('root')).render(
  <Root
    initialState={{ ...initialState, theme: loadThemeState() }}
    extraMiddlewares={[
      client.theme.createThemePersistenceMiddleware(browserThemeStorage),
    ]}
  >
    <App tutorialProject={tutorialProject} />
  </Root>
);
