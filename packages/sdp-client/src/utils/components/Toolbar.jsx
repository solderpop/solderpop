import React from 'react';

import Menubar, { itemsPropTypes as menubarItemsPropTypes } from './Menubar';
import SolderpopLogo from './SolderpopLogo';

const Toolbar = ({ menuBarItems }) => (
  <div className="Toolbar">
    <SolderpopLogo />
    <Menubar items={menuBarItems} />
  </div>
);

Toolbar.propTypes = {
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
