import React from 'react';
import PropTypes from 'prop-types';

function SnackBarList({ onMouseOver, onMouseOut, children }) {
  return (
    <ul
      className="SnackBarList"
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {children}
    </ul>
  );
}

SnackBarList.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
  onMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func,
};

export default SnackBarList;
