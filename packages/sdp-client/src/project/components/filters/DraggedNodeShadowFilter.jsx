import React from 'react';

import ShadowFilter from './ShadowFilter.jsx';

const DraggedNodeShadowFilter = () => (
  <ShadowFilter
    id="draggedNodeShadow"
    dx={0}
    dy={1}
    deviation={4}
    slope={0.85}
  />
);

export default DraggedNodeShadowFilter;
