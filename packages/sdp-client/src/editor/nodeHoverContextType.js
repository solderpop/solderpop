import React from 'react';

// Shape: { nodeId: String|null, onMouseOver: Function, onMouseLeave: Function }
// Don't be tempted to use this context for other tasks if you can solve
// them differently -- see Patch/index.jsx's Provider for why it exists.
export default React.createContext({
  nodeId: null,
  onMouseOver: () => {},
  onMouseLeave: () => {},
});
