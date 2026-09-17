import React from 'react';

import '../src/core/styles/main.scss';
import PinLabel from '../src/project/components/PinLabel.jsx';
// because filters are defined there
import PatchSVG from '../src/project/components/PatchSVG.jsx';

const pinCenter = { x: 70, y: 70 };

const baseProps = {
  keyName: "my pin's keyname",
  label: 'PIN',
  direction: 'input',
  position: pinCenter,
};

export default {
  title: 'PinLabel',
  decorators: [
    (Story) => (
      <PatchSVG>
        <g>
          <rect
            width={pinCenter.x * 2}
            height={pinCenter.y * 2}
            fill="#676767"
          />
          <line
            x1={pinCenter.x}
            y1="0"
            x2={pinCenter.x}
            y2={pinCenter.y * 2}
            stroke="#373737"
          />
          <line
            x1="0"
            y1={pinCenter.y}
            x2={pinCenter.x * 2}
            y2={pinCenter.y}
            stroke="#373737"
          />
          <text y=".6em" fontSize="11" dy="0" fill="white">
            <tspan x=".3em" dy=".6em">
              cross line indicates center
            </tspan>
            <tspan x=".3em" dy="1.2em">
              position passed to pin
            </tspan>
          </text>
          <Story />
        </g>
      </PatchSVG>
    ),
  ],
};

export const Input = () => <PinLabel {...baseProps} direction="input" />;
export const Output = () => <PinLabel {...baseProps} direction="output" />;
