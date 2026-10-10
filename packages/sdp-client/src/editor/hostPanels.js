import React from 'react';

// Lets the host app (e.g. Electron) add sidebar panels that only it can
// provide. Value: { [panelId]: { title, switchClassName, render(settings) } }.
// The panel also needs an entry in `editor.panels` of the initial state.
const HostPanelsContext = React.createContext({});

export default HostPanelsContext;
