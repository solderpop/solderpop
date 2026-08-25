import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'sdp-project';
import { noop } from 'sdp-func-tools';

import WatchNodeBody from './WatchNodeBody.jsx';
import { getConstantValue } from './ConstantNodeBody.jsx';

const TweakNodeBody = props => (
  <WatchNodeBody
    {...props}
    label={props.label || getConstantValue(props) || XP.getBaseName(props.type)}
  />
);

TweakNodeBody.defaultProps = {
  onVariadicHandleDown: noop,
};

TweakNodeBody.propTypes = R.merge(WatchNodeBody.propTypes, {
  pins: PropTypes.any,
});

export default TweakNodeBody;
