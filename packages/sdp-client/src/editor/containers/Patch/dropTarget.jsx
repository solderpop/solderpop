import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useDrop } from 'react-dnd';

import { EDITOR_MODE, DRAGGED_ENTITY_TYPE } from '../../constants.js';

import {
  snapNodePositionToSlots,
  slotPositionToPixels,
} from '../../../project/nodeLayout.js';

const getDraggedPatchPosition = (offset, monitor, patchInstance) => {
  const globalDropPosition = monitor.getClientOffset();
  const bbox = patchInstance.dropTargetRootRef.getBoundingClientRect();
  const pxOffset = slotPositionToPixels(offset);

  return snapNodePositionToSlots({
    x: globalDropPosition.x - bbox.left - pxOffset.x,
    y: globalDropPosition.y - bbox.top - pxOffset.y,
  });
};

// react-dnd v16 dropped the class-HOC API (DropTarget) in favor of the
// useDrop hook, which only works in function components -- Patch itself
// stays a class (too large and too depended-on by the mode-handler code
// to convert). This wraps it in a thin function component that forwards
// a ref to the real Patch instance so drop/hover can still reach its
// instance methods, the same way the old HOC's `component` spec argument
// used to.
const withDropTarget = (PatchComponent) => {
  const WithDropTarget = forwardRef((props, forwardedRef) => {
    const patchRef = useRef(null);
    useImperativeHandle(forwardedRef, () => patchRef.current);

    const [{ isPatchDraggedOver, dropTargetHandlerId }, connectDropTarget] = useDrop(
      () => ({
        accept: DRAGGED_ENTITY_TYPE.PATCH,
        canDrop: (item) => item.patchPath !== props.patchPath,
        drop: (item, monitor) => {
          const patchInstance = patchRef.current;
          if (!patchInstance || !patchInstance.dropTargetRootRef) return;

          const newNodePosition = getDraggedPatchPosition(
            props.offset,
            monitor,
            patchInstance
          );
          patchInstance.addNode(item.patchPath, newNodePosition);
          patchInstance.goToDefaultMode();
        },
        hover: (item, monitor) => {
          const patchInstance = patchRef.current;
          if (!patchInstance || !patchInstance.dropTargetRootRef) return;
          if (!monitor.isOver()) return;

          patchInstance.setModeStateThrottled(
            EDITOR_MODE.ACCEPTING_DRAGGED_PATCH,
            {
              previewPosition: getDraggedPatchPosition(
                props.offset,
                monitor,
                patchInstance
              ),
            }
          );
        },
        collect: (monitor) => ({
          isPatchDraggedOver: monitor.isOver(),
          // Exposed so test code can look up this target's handler id
          // (there's no registry method to list all registered targets
          // -- this is react-dnd's own recommended way to get one for
          // simulateHover/simulateDrop in a test backend).
          dropTargetHandlerId: monitor.getHandlerId(),
        }),
      }),
      [props.offset, props.patchPath]
    );

    return (
      <PatchComponent
        {...props}
        ref={patchRef}
        connectDropTarget={connectDropTarget}
        isPatchDraggedOver={isPatchDraggedOver}
        dropTargetHandlerId={dropTargetHandlerId}
      />
    );
  });
  return WithDropTarget;
};

export default withDropTarget;
