import * as R from 'ramda';

export const bindApi = (api, fn) => (...args) => fn(api, ...args);

// :: Point -> Number -> String
export const getOffsetMatrix = ({ x, y }, zoom) =>
  `matrix(${zoom}, 0, 0, ${zoom}, ${Math.round(x)}, ${Math.round(y)})`;

// :: Ref -> Point -> Number -> Event -> Point
export const getMousePosition = (rootRef, offset, zoom, event) => {
  // TODO: warn that we returned default value?
  if (!rootRef) return { x: 0, y: 0 };

  const bbox = rootRef.getBoundingClientRect();

  return {
    x: (event.clientX - bbox.left - offset.x) / zoom,
    y: (event.clientY - bbox.top - offset.y) / zoom,
  };
};

// :: Event -> Boolean
export const isMiddleButtonPressed = R.pathEq(['nativeEvent', 'which'], 2);
