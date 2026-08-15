import React from 'react';
import PropTypes from 'prop-types';
import * as remoteElectron from '@electron/remote';

import iconUrl from '../assets/solderpop-icon.svg';

const APP_TITLE = 'SolderPop IDE';

// The native OS menu bar disappears along with the rest of the window frame
// when `frame: false` is set, but the underlying Electron Menu (built in
// App#initNativeMenu) still exists — it's just not drawn anywhere. Re-expose
// it as clickable labels here so File/Edit/Deploy/etc remain reachable.
// macOS keeps its own persistent system-wide menu bar regardless of window
// frame, so this is only needed on Linux/Windows.
const SHOW_MENU_BUTTONS = process.platform !== 'darwin';

const getWin = () => remoteElectron.getCurrentWindow();

export default class TitleBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMaximized: getWin().isMaximized(),
      menuItems: [],
    };

    this.onMinimizeClick = this.onMinimizeClick.bind(this);
    this.onMaximizeClick = this.onMaximizeClick.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.syncMaximizedState = this.syncMaximizedState.bind(this);
  }

  componentDidMount() {
    getWin().on('maximize', this.syncMaximizedState);
    getWin().on('unmaximize', this.syncMaximizedState);

    if (SHOW_MENU_BUTTONS) {
      const appMenu = remoteElectron.Menu.getApplicationMenu();
      this.setState({ menuItems: appMenu ? appMenu.items : [] });
    }
  }

  componentWillUnmount() {
    getWin().removeListener('maximize', this.syncMaximizedState);
    getWin().removeListener('unmaximize', this.syncMaximizedState);
  }

  syncMaximizedState() {
    this.setState({ isMaximized: getWin().isMaximized() });
  }

  onMinimizeClick() {
    getWin().minimize();
  }

  onMaximizeClick() {
    const win = getWin();
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }

  onCloseClick() {
    getWin().close();
  }

  onDoubleClick() {
    this.onMaximizeClick();
  }

  onMenuItemClick(item, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    item.submenu.popup({
      window: getWin(),
      x: Math.round(rect.left),
      y: Math.round(rect.bottom),
    });
  }

  render() {
    const { projectPath } = this.props;
    const title = projectPath ? `${projectPath} — ${APP_TITLE}` : APP_TITLE;

    return (
      <div className="TitleBar" onDoubleClick={this.onDoubleClick}>
        <div className="TitleBar-drag">
          <img className="TitleBar-icon" src={iconUrl} alt="" />
          {this.state.menuItems.length > 0 ? (
            <nav className="TitleBar-menu">
              {this.state.menuItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  className="TitleBar-menuItem"
                  onClick={event => this.onMenuItemClick(item, event)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : null}
          <span className="TitleBar-title">{title}</span>
        </div>
        <div className="TitleBar-controls">
          <button
            type="button"
            className="TitleBar-button TitleBar-button--minimize"
            onClick={this.onMinimizeClick}
            title="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="TitleBar-button TitleBar-button--maximize"
            onClick={this.onMaximizeClick}
            title={this.state.isMaximized ? 'Restore' : 'Maximize'}
          >
            {this.state.isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="2"
                  y="0"
                  width="8"
                  height="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <rect
                  x="0"
                  y="2"
                  width="8"
                  height="8"
                  fill="var(--titlebar-bg, #1e2a38)"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="TitleBar-button TitleBar-button--close"
            onClick={this.onCloseClick}
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line
                x1="0"
                y1="0"
                x2="10"
                y2="10"
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1="10"
                y1="0"
                x2="0"
                y2="10"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }
}

TitleBar.propTypes = {
  projectPath: PropTypes.string,
};

TitleBar.defaultProps = {
  projectPath: null,
};
