import React from 'react';
import chai from 'chai';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { DndProvider, useDrag } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';

import withDropTarget from '../src/editor/containers/Patch/dropTarget.jsx';
import { DRAGGED_ENTITY_TYPE } from '../src/editor/constants.js';

const { assert } = chai;

// A minimal stand-in for the real Patch class: withDropTarget only ever
// touches dropTargetRootRef/addNode/goToDefaultMode/setModeStateThrottled
// on the ref it forwards, so a stub exposing exactly those is enough to
// verify the wrapper's wiring without pulling in the real (huge) Patch.
class StubPatch extends React.Component {
  constructor(props) {
    super(props);
    this.dropTargetRootRef = null;
    this.addNodeCalledWith = null;
    this.wentToDefaultMode = false;
  }

  addNode(patchPath, position) {
    this.addNodeCalledWith = { patchPath, position };
  }

  goToDefaultMode() {
    this.wentToDefaultMode = true;
  }

  setModeStateThrottled() {}

  render() {
    return this.props.connectDropTarget(
      React.createElement('div', {
        ref: (el) => {
          this.dropTargetRootRef = el;
        },
      })
    );
  }
}

function DragSourcePatch({ onHandlerId }) {
  const [{ handlerId }, dragRef] = useDrag(() => ({
    type: DRAGGED_ENTITY_TYPE.PATCH,
    item: { patchPath: '@/dragged-patch' },
    collect: (monitor) => ({ handlerId: monitor.getHandlerId() }),
  }));
  React.useEffect(() => {
    if (handlerId) onHandlerId(handlerId);
  }, [handlerId, onHandlerId]);
  return React.createElement('div', { ref: dragRef, id: 'source' });
}

describe('react-dnd v16 migration (withDropTarget)', () => {
  it('a drag from a real useDrag source drops onto the withDropTarget-wrapped Patch stand-in and reaches its addNode/goToDefaultMode via the forwarded ref', async () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="root"></div></body></html>'
    );
    global.window = dom.window;
    global.document = dom.window.document;

    try {
      let manager;
      const backendFactory = (m) => {
        manager = m;
        // eslint-disable-next-line new-cap
        return TestBackend(m);
      };

      const patchRef = React.createRef();
      const WrappedStubPatch = withDropTarget(StubPatch);
      let sourceHandlerId = null;

      const app = React.createElement(
        DndProvider,
        { backend: backendFactory },
        React.createElement(DragSourcePatch, {
          onHandlerId: (id) => {
            sourceHandlerId = id;
          },
        }),
        React.createElement(WrappedStubPatch, {
          ref: patchRef,
          offset: { x: 0, y: 0 },
          patchPath: '@/current-patch',
        })
      );

      const container = document.getElementById('root');
      const root = createRoot(container);
      root.render(app);
      await new Promise((r) => setTimeout(r, 200));

      assert.isOk(
        patchRef.current.dropTargetRootRef,
        'the forwarded ref should reach the real StubPatch instance, with its own ref callback fired'
      );
      assert.isOk(
        sourceHandlerId,
        'useDrag should have collected a handlerId for the drag source'
      );
      const targetHandlerId = patchRef.current.props.dropTargetHandlerId;
      assert.isOk(
        targetHandlerId,
        'withDropTarget should collect and forward a dropTargetHandlerId prop'
      );

      // jsdom doesn't implement layout
      patchRef.current.dropTargetRootRef.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
      });

      const backend = manager.getBackend();
      backend.simulateBeginDrag([sourceHandlerId], {
        clientOffset: { x: 10, y: 20 },
        getSourceClientOffset: () => ({ x: 0, y: 0 }),
      });
      backend.simulateHover([targetHandlerId], {
        clientOffset: { x: 10, y: 20 },
      });
      backend.simulateDrop();

      assert.deepEqual(
        patchRef.current.addNodeCalledWith.patchPath,
        '@/dragged-patch',
        'drop() should reach the stand-in instance via the ref and call addNode with the dragged patch path'
      );
      assert.isTrue(
        patchRef.current.wentToDefaultMode,
        'drop() should call goToDefaultMode on the stand-in instance'
      );

      backend.simulateEndDrag();
      root.unmount();
      // Let React's scheduler flush whatever unmount() queued before
      // tearing down the globals it's still running against.
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      delete global.window;
      delete global.document;
    }
  });
});
