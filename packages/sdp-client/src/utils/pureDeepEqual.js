import R from 'ramda';
import React from 'react';

export default (Component) => React.memo(Component, R.equals);
