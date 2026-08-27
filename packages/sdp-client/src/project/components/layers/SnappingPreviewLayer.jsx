import React from 'react';
import PT from 'prop-types';

import { Position, Size } from 'sdp-project';
import sanctuaryPropType from '../../../utils/sanctuaryPropType.js';

import { NODE_CORNER_RADIUS } from '../../nodeLayout.js';

function SnappingPreviewLayer({ previews }) {
  return (
    <g className="SnappingPreviewLayer">
      {previews.map(({ pxPosition, pxSize }, key) => (
        <rect
          key={key} // in this particular case it's okay to use index as key
          className="SnappingPreview"
          {...pxPosition}
          {...pxSize}
          rx={NODE_CORNER_RADIUS}
          ry={NODE_CORNER_RADIUS}
        />
      ))}
    </g>
  );
}

SnappingPreviewLayer.displayName = 'SnappingPreviewLayer';

SnappingPreviewLayer.propTypes = {
  previews: PT.arrayOf(
    PT.shape({
      pxPosition: sanctuaryPropType(Position),
      pxSize: sanctuaryPropType(Size),
    })
  ),
};

export default SnappingPreviewLayer;
