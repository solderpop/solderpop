import React from 'react';

import '../src/core/styles/main.scss';

export default { title: 'Button' };

export const Dark = () => <button className="Button">Cancel</button>;

export const DarkDisabled = () => (
  <button className="Button" disabled>
    Cancel
  </button>
);

export const Light = () => (
  <button className="Button Button--light">Cancel</button>
);

export const LightDisabled = () => (
  <button className="Button Button--light" disabled>
    Cancel
  </button>
);
