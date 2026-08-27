import React from 'react';

function SolderpopLogo() {
  return (
    <svg viewBox="0 0 80 80" className="SolderpopLogo">
      <circle className="SolderpopLogo-main" cx="36" cy="42" r="26" />
      <circle
        className="SolderpopLogo-ring"
        cx="58"
        cy="20"
        r="11"
        strokeWidth="3"
      />
      <circle
        className="SolderpopLogo-ring"
        cx="50"
        cy="28"
        r="3"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default SolderpopLogo;
