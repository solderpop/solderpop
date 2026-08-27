import React from 'react';

import Menubar, {
  itemsPropTypes as menubarItemsPropTypes,
} from './Menubar.jsx';
import SolderpopLogo from './SolderpopLogo.jsx';

function Toolbar({ menuBarItems }) {
  return (
    <div className="Toolbar">
      <SolderpopLogo />
      <Menubar items={menuBarItems} />
    </div>
  );
}

Toolbar.propTypes = {
  menuBarItems: menubarItemsPropTypes,
};

export default Toolbar;
