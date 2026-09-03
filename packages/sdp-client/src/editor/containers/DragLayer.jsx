import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useDragLayer } from 'react-dnd';

import * as XP from 'sdp-project';

import * as ProjectSelectors from '../../project/selectors.js';
import { patchToNodeProps } from '../../project/utils.js';
import { addPoints, subtractPoints } from '../../project/nodeLayout.js';
import Node from '../../project/components/Node.jsx';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

const getItemStyles = ({
  initialClientOffset,
  initialSourceClientOffset,
  currentOffset,
}) => {
  if (!initialClientOffset || !initialSourceClientOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const offsetFromSourceRoot = subtractPoints(
    initialClientOffset,
    initialSourceClientOffset
  );
  const { x, y } = addPoints(offsetFromSourceRoot, currentOffset);

  return {
    transform: `translate(${x + 0.5}px, ${y + 0.5}px)`,
  };
};

const renderPatchAsNode = (item, project) =>
  R.compose(
    (maybeRenderedPatch) => maybeRenderedPatch.getOrElse(null),
    R.map(
      R.compose(
        (props) => (
          <Node
            {...props}
            position={props.pxPosition}
            size={props.pxSize}
            isDragged
            noEvents
          />
        ),
        patchToNodeProps(false)
      )
    ),
    XP.getPatchByPath(item.patchPath)
  )(project);

function CustomDragLayer({ project }) {
  const {
    item,
    initialClientOffset,
    initialSourceClientOffset,
    currentOffset,
    isDragging,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    // TODO: add monitor.getItemType() when there are more types
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div
        style={getItemStyles({
          initialClientOffset,
          initialSourceClientOffset,
          currentOffset,
        })}
      >
        {renderPatchAsNode(item, project)}
      </div>
    </div>
  );
}

CustomDragLayer.propTypes = {
  project: PropTypes.object.isRequired,
};

const mapStateToProps = R.applySpec({
  project: ProjectSelectors.getProject,
});

export default connect(mapStateToProps)(CustomDragLayer);
