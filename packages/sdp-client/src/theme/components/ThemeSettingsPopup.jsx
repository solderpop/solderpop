import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as R from 'ramda';

import * as actions from '../actions.ts';
import * as selectors from '../selectors.ts';
import { COLORS, COLOR_GROUPS } from '../colorRegistry.ts';
import { HEX_COLOR } from '../themeFile.ts';

const COLORS_BY_GROUP = COLOR_GROUPS.map((group) => ({
  ...group,
  colors: COLORS.filter((c) => c.group === group.id),
}));

class ThemeSettingsPopup extends React.PureComponent {
  constructor(props) {
    super(props);

    this.windowRef = null;
    this.dragState = null;
    this.colorInputs = {};
    this.assignWindowRef = this.assignWindowRef.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.handleDragMove = this.handleDragMove.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleHexChange = this.handleHexChange.bind(this);
    this.openColorPicker = this.openColorPicker.bind(this);
    this.hide = this.hide.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
    this.toggleColorCustomization = this.toggleColorCustomization.bind(this);

    this.state = {
      isPreviewMode: false,
      hexDrafts: {},
      showColorCustomization: false,
      position: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isVisible && this.props.isVisible) {
      this.setState({
        position: null,
        hexDrafts: {},
        showColorCustomization: false,
      });
    }
    if (!R.equals(prevProps.currentTheme, this.props.currentTheme)) {
      this.setState({ hexDrafts: {} });
    }
  }

  componentWillUnmount() {
    this.handleDragEnd();
  }

  hide() {
    this.props.onClose();
  }

  assignWindowRef(ref) {
    this.windowRef = ref;
  }

  startDrag(e) {
    if (e.button !== 0) return;
    const node = this.windowRef;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    this.dragState = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
    };
    this.setState({ position: { left: rect.left, top: rect.top } });
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
    e.preventDefault();
  }

  handleDragMove(e) {
    if (!this.dragState) return;
    const { startX, startY, origLeft, origTop } = this.dragState;
    this.setState({
      position: {
        left: origLeft + e.clientX - startX,
        top: origTop + e.clientY - startY,
      },
    });
  }

  handleDragEnd() {
    this.dragState = null;
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  handleThemeChange(themeKey) {
    this.setState({ hexDrafts: {} });
    this.props.actions.setTheme(themeKey);
  }

  handleColorChange(colorKey, value) {
    this.props.actions.setThemeColor(colorKey, value);
  }

  handleHexChange(colorKey, value) {
    this.setState({
      hexDrafts: R.assoc(colorKey, value, this.state.hexDrafts),
    });
    if (HEX_COLOR.test(value)) {
      this.handleColorChange(colorKey, value);
    }
  }

  openColorPicker(colorKey) {
    const input = this.colorInputs[colorKey];
    if (input) {
      input.click();
    }
  }

  togglePreview() {
    this.setState({ isPreviewMode: !this.state.isPreviewMode });
  }

  toggleColorCustomization() {
    this.setState({
      showColorCustomization: !this.state.showColorCustomization,
    });
  }

  renderThemeSelector() {
    const { currentTheme, themes } = this.props;
    const [bundled, user] = R.partition(
      (theme) => theme.source === 'bundled',
      R.values(themes)
    );
    const renderOption = (theme) => (
      <option key={theme.id} value={theme.id}>
        {theme.name}
      </option>
    );
    const isUserTheme = themes[currentTheme].source === 'user';

    return (
      <div className="theme-selector">
        <h3>Theme template</h3>
        <div className="theme-select">
          <label htmlFor="theme-select">Preset</label>
          <select
            id="theme-select"
            value={currentTheme}
            onChange={(e) => this.handleThemeChange(e.target.value)}
          >
            <optgroup label="Built-in">{bundled.map(renderOption)}</optgroup>
            {user.length > 0 && (
              <optgroup label="Custom">{user.map(renderOption)}</optgroup>
            )}
          </select>
          {isUserTheme && (
            <button
              type="button"
              className="theme-delete"
              onClick={() => this.props.actions.deleteTheme(currentTheme)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  renderColorGroups() {
    const { currentTheme, themes } = this.props;
    const { colors, source, name } = themes[currentTheme];

    return (
      <div className="color-groups">
        {source === 'bundled' && (
          <p className="color-groups-note">
            {name} is a built-in theme. Changing a colour saves your edits as
            a new custom theme.
          </p>
        )}
        {COLORS_BY_GROUP.map((group) => (
          <div key={group.id} className="color-group">
            <h4>{group.label}</h4>
            <div className="color-list">
              {group.colors.map(({ key, label, description }) => {
                const colorValue = colors[key];
                const hexValue = this.state.hexDrafts[key] || colorValue;

                return (
                  <div key={key} className="color-item" title={description}>
                    <button
                      type="button"
                      className="color-swatch"
                      style={{ backgroundColor: colorValue }}
                      aria-label={`Pick color for ${label}`}
                      onClick={() => this.openColorPicker(key)}
                    />
                    <span className="color-name">
                      {label}
                      <span className="color-description">{description}</span>
                    </span>
                    <input
                      type="text"
                      className="color-hex"
                      value={hexValue}
                      aria-label={`${label} hex value`}
                      onChange={(e) => this.handleHexChange(key, e.target.value)}
                    />
                    <input
                      type="color"
                      className="color-input-hidden"
                      value={colorValue}
                      aria-label={`${label} color picker`}
                      ref={(el) => {
                        this.colorInputs[key] = el;
                      }}
                      onChange={(e) => this.handleColorChange(key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderPreview() {
    const { currentTheme, themes } = this.props;
    const { colors } = themes[currentTheme];

    return (
      <div className="theme-preview">
        <div
          className="preview-panel"
          style={{
            backgroundColor: colors['window.background'],
            color: colors['window.foreground'],
          }}
        >
          <p className="preview-title">Theme preview</p>
          <p className="preview-text">
            Sample text shows how the palette colors the IDE.
          </p>
          <span
            className="preview-node"
            style={{
              color: colors['node.title.foreground'],
              backgroundColor: colors['node.body.background'],
              borderColor: colors['node.border'],
            }}
          >
            node
          </span>
          <span
            className="preview-error"
            style={{
              color: colors['error.foreground'],
              borderColor: colors['error.accent'],
            }}
          >
            error
          </span>
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.isVisible) return null;

    const { position } = this.state;
    const windowStyle = position
      ? { left: position.left, top: position.top }
      : null;
    const windowClassName = position
      ? 'theme-window positioned'
      : 'theme-window';

    return (
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className="theme-window-overlay"
        onClick={this.hide}
        role="presentation"
      >
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          ref={this.assignWindowRef}
          className={windowClassName}
          style={windowStyle}
          role="dialog"
          aria-label="Theme Settings"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="theme-window-header" onMouseDown={this.startDrag}>
            <span className="theme-window-title">Theme Settings</span>
            <button
              type="button"
              className="theme-window-close"
              aria-label="Close"
              onClick={this.hide}
            >
              ×
            </button>
          </div>
          <div className="theme-window-body">
            {this.renderThemeSelector()}
            <div className="advanced-section">
              <button
                type="button"
                className="advanced-toggle"
                aria-expanded={this.state.showColorCustomization}
                onClick={this.toggleColorCustomization}
              >
                <span className="advanced-chevron">
                  {this.state.showColorCustomization ? '▾' : '▸'}
                </span>
                Advanced color customization
              </button>
              {this.state.showColorCustomization && this.renderColorGroups()}
            </div>
            <div className="preview-section">
              <button
                type="button"
                className="preview-btn"
                onClick={this.togglePreview}
              >
                {this.state.isPreviewMode ? 'Hide Preview' : 'Show Preview'}
              </button>
              {this.state.isPreviewMode && this.renderPreview()}
            </div>
            <div className="popup-footer">
              <button type="button" className="apply-btn" onClick={this.hide}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ThemeSettingsPopup.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
  currentTheme: PropTypes.string.isRequired,
  themes: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

const mapStateToProps = R.applySpec({
  currentTheme: selectors.getCurrentTheme,
  themes: selectors.getThemeList,
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ThemeSettingsPopup);
