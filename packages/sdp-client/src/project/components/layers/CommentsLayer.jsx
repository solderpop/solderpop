import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual.js';

import { isCommentSelected } from '../../../editor/utils.js';

import Comment from '../Comment.jsx';

function CommentsLayer({
  comments,
  selection,
  areDragged,
  onMouseDown,
  onMouseUp,
  onResizeHandleMouseDown,
  onFinishEditing,
}) {
  return (
    <g className="CommentsLayer">
      {R.compose(
        R.map((comment) => (
          <Comment
            key={comment.id}
            id={comment.id}
            content={comment.content}
            position={comment.position}
            pxPosition={comment.pxPosition}
            hidden={comment.hidden}
            size={comment.size}
            pxSize={comment.pxSize}
            isSelected={isCommentSelected(selection, comment.id)}
            isDragged={areDragged}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onResizeHandleMouseDown={onResizeHandleMouseDown}
            onFinishEditing={onFinishEditing}
          />
        )),
        R.values
      )(comments)}
    </g>
  );
}

CommentsLayer.defaultProps = {
  areDragged: false,
};

CommentsLayer.propTypes = {
  comments: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  areDragged: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func,
  onFinishEditing: PropTypes.func,
};

export default pureDeepEqual(CommentsLayer);
