import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import '../src/core/styles/main.scss';
import PatchGroupItem from '../src/projectBrowser/components/PatchGroupItem.jsx';

export default {
  title: 'PatchGroupItem',
  // Items are drag sources, so they need the editor's DnD context.
  decorators: [
    (Story) => (
      <DndProvider backend={HTML5Backend}>
        <Story />
      </DndProvider>
    ),
  ],
};

export const Default = () => (
  <div style={{ width: '200px', backgroundColor: 'tomato' }}>
    <PatchGroupItem label="Item 1" />
    <PatchGroupItem
      label="Item 2"
      hoverButtons={[
        <i key="add" className="fa fa-plus-circle hover-button" />,
      ]}
    />
    <PatchGroupItem label="Item with moderately big label" />
    <PatchGroupItem label="Item with a really big label that definitely won't fit" />
  </div>
);
