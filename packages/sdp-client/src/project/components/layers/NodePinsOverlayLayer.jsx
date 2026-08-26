import R from 'ramda';
import cn from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import { getBaseName } from 'sdp-project';

import pureDeepEqual from '../../../utils/pureDeepEqual.js';

import NodePinsOverlay from '../NodePinsOverlay.jsx';
import { getPinLinkabilityValidator } from '../../utils.js';

function NodePinsOverlayLayer({
  nodes,
  linkingPin,
  hidden,
  onPinMouseUp,
  onPinMouseDown,
}) {
  const pinLinkabilityValidator = getPinLinkabilityValidator(linkingPin, nodes);

  return (
    <g className={cn('PinsOverlayLayer', { hidden })}>
      {R.compose(
        R.map((node) => (
          <NodePinsOverlay
            key={node.id}
            id={node.id}
            position={node.pxPosition}
            nodeLabel={node.label || getBaseName(node.type)}
            size={node.pxSize}
            pins={node.pins}
            linkingPin={linkingPin}
            onPinMouseUp={onPinMouseUp}
            onPinMouseDown={onPinMouseDown}
            pinLinkabilityValidator={pinLinkabilityValidator}
          />
        )),
        R.values
      )(nodes)}
    </g>
  );
}

NodePinsOverlayLayer.propTypes = {
  nodes: PropTypes.objectOf(PropTypes.object),
  hidden: PropTypes.bool,
  linkingPin: PropTypes.object,
  onPinMouseUp: PropTypes.func,
  onPinMouseDown: PropTypes.func,
};

export default pureDeepEqual(NodePinsOverlayLayer);
