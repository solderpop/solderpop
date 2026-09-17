import React from 'react';

import '../src/core/styles/main.scss';
import XODLink from '../src/project/components/Link.jsx';

const pFrom = { x: 30, y: 30 };
const pTo = { x: 120, y: 120 };

const baseProps = {
  id: 'qwerty',
  from: pFrom,
  to: pTo,
  isGhost: false,
  isSelected: false,
  type: 'string',
};

export default {
  title: 'Link',
  decorators: [
    (Story) => (
      <svg>
        <rect
          width={pFrom.x * 2 + pTo.x}
          height={pFrom.y * 2 + pTo.x}
          fill="#676767"
        />
        <circle cx={pFrom.x} cy={pFrom.y} r="1" fill="red" />
        <circle cx={pTo.x} cy={pTo.y} r="1" fill="red" />
        <Story />
      </svg>
    ),
  ],
};

export const String_ = () => <XODLink {...baseProps} type="string" />;
export const Bool = () => <XODLink {...baseProps} type="boolean" />;
export const Number_ = () => <XODLink {...baseProps} type="number" />;
export const Pulse = () => <XODLink {...baseProps} type="pulse" />;
export const Selected = () => <XODLink {...baseProps} isSelected />;
