import React from 'react';
import PropTypes from 'prop-types';

import { noop } from '../../../../utils/ramda.js';
import Pin from '../../../../project/components/Pin.jsx';
import { PIN_RADIUS_WITH_SHADOW } from '../../../../project/nodeLayout.js';

const pinPos = { x: PIN_RADIUS_WITH_SHADOW, y: PIN_RADIUS_WITH_SHADOW };

const PinIcon = ({
  id,
  type,
  isConnected,
  isInvalid,
  deducedType,
  isLastVariadicGroup,
}) => (
  <svg
    width={PIN_RADIUS_WITH_SHADOW * 2}
    height={PIN_RADIUS_WITH_SHADOW * 2}
    className="PinIcon"
  >
    <Pin
      keyName={`widgetPinIcon_${id}`}
      type={type}
      position={pinPos}
      onMouseUp={noop}
      onMouseDown={noop}
      isSelected={false}
      isConnected={isConnected}
      isInvalid={isInvalid}
      deducedType={deducedType}
      isLastVariadicGroup={isLastVariadicGroup}
      isAcceptingLinks={false}
    />
  </svg>
);

PinIcon.displayName = 'PinIcon';

PinIcon.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  isInvalid: PropTypes.bool,
  deducedType: PropTypes.object,
  isLastVariadicGroup: PropTypes.bool.isRequired,
};

export default PinIcon;
