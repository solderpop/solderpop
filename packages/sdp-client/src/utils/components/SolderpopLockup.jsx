import React from 'react';

function SolderpopLockup() {
  return (
    <svg viewBox="0 0 260 56" className="SolderpopLockup">
      <circle className="SolderpopLockup-main" cx="22" cy="30" r="18" />
      <circle
        className="SolderpopLockup-ring"
        cx="40"
        cy="14"
        r="8"
        strokeWidth="2.5"
      />
      <circle
        className="SolderpopLockup-ring"
        cx="33"
        cy="20"
        r="2.2"
        strokeWidth="1.2"
      />
      <text
        x="58"
        y="36"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="26"
      >
        <tspan className="SolderpopLockup-wordmark">Solder</tspan>
        <tspan className="SolderpopLockup-accent">Pop</tspan>
      </text>
    </svg>
  );
}

export default SolderpopLockup;
