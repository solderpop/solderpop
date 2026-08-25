import React from 'react';
import { HotKeys } from 'react-hotkeys';

import PatchSVG from '../../../../project/components/PatchSVG.jsx';
import * as Layers from '../../../../project/components/layers/index.js';

import { getOffsetMatrix } from '../modeUtils.js';

const acceptingDraggedPatchMode = {
  getInitialState() {
    return {
      previewPosition: {},
    };
  },

  render(api) {
    const snappedPreviews = api.props.isPatchDraggedOver
      ? [
          {
            pxPosition: api.state.previewPosition,
            pxSize: api.props.draggedPreviewSize,
          },
        ]
      : [];

    return (
      <HotKeys className="PatchWrapper" handlers={{}}>
        <PatchSVG>
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            zoom={api.getZoom()}
            offset={api.getOffset()}
          />
          <g transform={getOffsetMatrix(api.getOffset(), api.getZoom())}>
            <Layers.Comments
              comments={api.props.comments}
              selection={api.props.selection}
              onFinishEditing={api.props.actions.editComment}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.Nodes
              nodes={api.props.nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.LinksOverlay
              hidden // to avoid heavy remounting
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.NodePinsOverlay
              hidden // to avoid heavy remounting
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
            />

            <Layers.SnappingPreview previews={snappedPreviews} />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default acceptingDraggedPatchMode;
