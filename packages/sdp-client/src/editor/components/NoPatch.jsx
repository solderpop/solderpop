import React from 'react';

function NoPatch() {
  return (
    <div className="NoPatch">
      <svg viewBox="4 5.5 57 54.5" className="logo">
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
            <feComposite
              operator="in"
              in="color"
              in2="inverse"
              result="shadow"
            />
            <feComponentTransfer in="shadow" result="shadow">
              <feFuncA type="linear" slope=".25" />
            </feComponentTransfer>
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>
        <path className="logo-stroke" d="M22,42 Q34.1,36.35 40.84,24.73" />
        <path className="logo-stroke" d="M22,42 Q33.5,46.65 45.05,45.29" />
        <circle className="logo-main" cx="22" cy="42" r="12" />
        <ellipse className="logo-shine" cx="17" cy="37" rx="3.5" ry="2.2" />
        <circle className="logo-ring" cx="46" cy="20" r="7" strokeWidth="3" />
        <circle className="logo-main" cx="50" cy="46" r="5" />
      </svg>
    </div>
  );
}

export default NoPatch;
