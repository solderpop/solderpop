import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as R from 'ramda';

import client from 'sdp-client';

import lockupLight from '../../view/assets/solderpop-lockup.svg';
import lockupDark from '../../view/assets/solderpop-lockup-dark.svg';

// Picks the lockup variant readable against the dialog's own chrome
// background (which follows the selected theme), rather than hardcoding
// by theme name — stays correct if more themes get added later.
const relativeLuminance = (hex) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16) / 255;
  const g = parseInt(value.substring(2, 4), 16) / 255;
  const b = parseInt(value.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

class WelcomeDialog extends React.Component {
  constructor(props) {
    super(props);

    // Opt-in, not opt-out: unchecked by default so nobody gets a
    // ~300 MB download just for opening the IDE to look around.
    this.state = { enableSimulation: false };

    this.onClose = this.onClose.bind(this);
    this.onContinue = this.onContinue.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  onToggle() {
    this.setState((state) => ({ enableSimulation: !state.enableSimulation }));
  }

  onContinue() {
    if (this.state.enableSimulation) {
      this.props.onInstallClick();
    }
    this.onClose();
  }

  handleThemeChange(themeKey) {
    this.props.actions.setTheme(themeKey);
  }

  renderThemeSelector() {
    const { currentTheme, themes } = this.props;

    return (
      <div className="theme-select welcome-theme-select">
        <label htmlFor="welcome-theme-select">Preset</label>
        <select
          id="welcome-theme-select"
          value={currentTheme}
          onChange={(e) => this.handleThemeChange(e.target.value)}
        >
          {R.toPairs(themes).map(([themeKey, theme]) => (
            <option key={themeKey} value={themeKey}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  render() {
    if (!this.props.isVisible) return null;

    const { currentTheme, themes } = this.props;
    const { chromeBg } = themes[currentTheme].colors;
    const lockupSrc =
      relativeLuminance(chromeBg) < 0.5 ? lockupDark : lockupLight;

    return (
      <div className="theme-window-overlay" role="presentation">
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className="theme-window welcome-dialog"
          role="dialog"
          aria-label="Welcome to SolderPop IDE"
        >
          <div className="theme-window-body">
            <h2 className="welcome-title">
              Welcome to
              <img
                className="welcome-title-lockup"
                src={lockupSrc}
                alt="SolderPop IDE"
              />
            </h2>
            <p className="welcome-intro">
              SolderPop IDE lets you build and simulate circuits visually.
            </p>
            <h3>Theme</h3>
            {this.renderThemeSelector()}
            <div className="welcome-option">
              <label
                className="welcome-checkbox"
                htmlFor="welcome-simulation-checkbox"
              >
                <input
                  id="welcome-simulation-checkbox"
                  type="checkbox"
                  checked={this.state.enableSimulation}
                  onChange={this.onToggle}
                />{' '}
                Enable local circuit simulation — downloads the Emscripten
                toolchain (~300 MB). You can turn this on later too, from the
                Deploy menu.
              </label>
            </div>
          </div>
          <div className="theme-window-footer">
            <button
              type="button"
              className="apply-btn"
              onClick={this.onContinue}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
}

WelcomeDialog.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onInstallClick: PropTypes.func.isRequired,
  currentTheme: PropTypes.string.isRequired,
  themes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

WelcomeDialog.defaultProps = {
  isVisible: false,
};

const mapStateToProps = R.applySpec({
  currentTheme: client.theme.selectors.getCurrentTheme,
  themes: client.theme.selectors.getThemeList,
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(client.theme.actions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(WelcomeDialog);
