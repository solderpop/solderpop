import R from 'ramda';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import Icon from '../../core/components/Icon.jsx';
import { ContextMenuTrigger } from 'react-contextmenu';

import { PATCH_GROUP_CONTEXT_MENU_ID } from '../constants.js';
import { DRAGGED_ENTITY_TYPE } from '../../editor/constants.js';

const deadIcon = (
  <Icon
    key="dead-patch-icon"
    className="dead-patch-icon"
    name="warning"
    title="Patch contains errors"
  />
);
const deprecatedIcon = (
  <span className="deprecated-patch-icon" title="Patch deprecated" />
);
const utilityIcon = (
  <span className="utility-patch-icon" title="Utility patch" />
);

function PatchGroupItem({
  label,
  patchPath,
  isSelected,
  isOpen,
  dead,
  isDeprecated,
  isUtility,
  className,
  hoverButtons,
  onClick,
  onDoubleClick,
  onBeginDrag,
  collectPropsFn,
  ...restProps
}) {
  const [, connectDragSource, connectDragPreview] = useDrag(
    () => ({
      type: DRAGGED_ENTITY_TYPE.PATCH,
      item: () => {
        onBeginDrag(patchPath);
        return { patchPath };
      },
    }),
    [patchPath, onBeginDrag]
  );

  useEffect(() => {
    // Use empty image as a drag preview so browsers don't draw it
    // and we can draw whatever we want on the custom drag layer instead.
    connectDragPreview(getEmptyImage());
  }, [connectDragPreview]);

  const classNames = cn('PatchGroupItem', className, {
    isSelected,
    isOpen,
  });

  return connectDragSource(
    <div // eslint-disable-line jsx-a11y/no-static-element-interactions
      role="button"
      data-id={label}
      className={classNames}
      onClick={onClick}
      onContextMenuCapture={onClick}
      {...R.omit(['dead'], restProps)}
    >
      <ContextMenuTrigger
        id={PATCH_GROUP_CONTEXT_MENU_ID}
        holdToDisplay={-1}
        collect={collectPropsFn}
      >
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className="PatchGroupItem__label"
          onDoubleClick={onDoubleClick}
          role="button"
        >
          {dead ? deadIcon : null}
          {isDeprecated ? deprecatedIcon : null}
          {isUtility ? utilityIcon : null}
          {label}
        </div>
      </ContextMenuTrigger>
      <div className="PatchGroupItem__hover-buttons">{hoverButtons}</div>
    </div>
  );
}

PatchGroupItem.propTypes = {
  label: PropTypes.string.isRequired,
  patchPath: PropTypes.string.isRequired,
  dead: PropTypes.bool,
  isDeprecated: PropTypes.bool,
  isUtility: PropTypes.bool,
  isSelected: PropTypes.bool,
  isOpen: PropTypes.bool,
  className: PropTypes.string,
  hoverButtons: PropTypes.array,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onBeginDrag: PropTypes.func.isRequired,
  collectPropsFn: PropTypes.func.isRequired,
};

export default React.memo(
  PatchGroupItem,
  R.eqBy(
    R.pick(['label', 'patchPath', 'dead', 'isSelected', 'isOpen', 'className'])
  )
);
