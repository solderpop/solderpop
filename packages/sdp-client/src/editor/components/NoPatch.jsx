import React from 'react';

const NoPatch = () => (
  <div className="NoPatch">
    <svg viewBox="0 0 80 80" className="logo">
      <defs>
        <filter id="inset-shadow">
          <feOffset dx="3" dy="3" />
          <feGaussianBlur stdDeviation="3" result="offset-blur" />
          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />
          <feFlood floodColor="black" floodOpacity="1" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComponentTransfer in="shadow" result="shadow">
            <feFuncA type="linear" slope=".25" />
          </feComponentTransfer>
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
      <circle className="logo-main" cx="36" cy="42" r="26" />
      <circle className="logo-ring" cx="58" cy="20" r="11" strokeWidth="3" />
      <circle className="logo-ring" cx="50" cy="28" r="3" strokeWidth="1.5" />
    </svg>
  </div>
);

export default NoPatch;
