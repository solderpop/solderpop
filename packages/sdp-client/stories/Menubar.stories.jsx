import React from 'react';

import '../src/core/styles/main.scss';
import Menubar from '../src/utils/components/Menubar.jsx';

export default {
  title: 'Menubar',
  decorators: [
    (Story) => (
      <div
        style={{
          // to see white submenus
          background: 'lightblue',
          height: '100vh',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Basic = () => {
  const menuBarItems = [
    { key: 1, label: 'Hello' },
    { key: 2, label: 'Menubar' },
  ];

  return <Menubar items={menuBarItems} />;
};

export const WithSubmenu = () => {
  const menuBarItems = [
    { key: 1, label: 'Hello' },
    {
      key: 2,
      label: 'Parent 1',
      submenu: [
        { key: 1, label: 'Child 1.1' },
        { key: 2, label: 'Child 1.2', hotkey: 'ctrl+alt+del' },
        { key: 3, type: 'separator' },
        { key: 4, label: 'Child 1.3' },
      ],
    },
    {
      key: 3,
      label: 'Parent 2',
      submenu: [
        { key: 1, label: 'Child 2.1' },
        { key: 2, label: 'Child 2.2' },
      ],
    },
  ];

  return <Menubar items={menuBarItems} />;
};
