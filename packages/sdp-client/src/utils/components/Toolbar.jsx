import React from 'react';

import Menubar, { itemsPropTypes as menubarItemsPropTypes } from './Menubar.jsx';

const Toolbar = ({ menuBarItems }) => (
  <div className="Toolbar">
    <Menubar items={menuBarItems} />
  </div>
);

Toolbar.propTypes = {
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
