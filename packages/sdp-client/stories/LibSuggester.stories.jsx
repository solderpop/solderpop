import React from 'react';

import LibSuggester from '../src/editor/components/LibSuggester.jsx';
import '../src/core/styles/main.scss';

export default {
  title: 'LibSuggester',
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          background: '#676767',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Basic = () => (
  <LibSuggester
    onInstallLibrary={(lib) => {
      // eslint-disable-next-line
      alert(`Library "${lib.owner}/${lib.libname}@${lib.version}" will be installed!`);
    }}
  />
);
