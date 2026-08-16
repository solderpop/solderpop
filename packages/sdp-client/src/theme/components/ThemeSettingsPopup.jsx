import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as R from 'ramda';

import * as actions from '../actions.js';
import * as selectors from '../selectors.js';

const COLOR_LABELS = {
  chromeBg: 'Window background',
  chromeTitleBg: 'Title bar',
  chromeOutlines: 'Window outlines',
  chromeLightBg: 'Light chrome',
  text: 'Base text',
  menubarBg: 'Menubar background',
  menubarText: 'Menubar text',
  menubarActiveBg: 'Active menu background',
  menubarActiveText: 'Active menu text',
  menubarHoverBg: 'Menu hover',
  tabBg: 'Tabs background',
  tabItemBg: 'Inactive tab',
  tabText: 'Tab text',
  sidebarBg: 'Sidebar background',
  sidebarHoverBg: 'Sidebar hover',
  sidebarSelectedBg: 'Sidebar selected',
  sidebarSelectedHoverBg: 'Selected hover',
  sidebarText: 'Sidebar text',
  sidebarSubtitle: 'Sidebar subtitle',
  workspaceBg: 'Workspace background',
  canvasBg: 'Canvas background',
  canvasGridlines: 'Canvas gridlines',
  canvasFace: 'Canvas face',
  canvasFaceLight: 'Canvas face (light)',
  canvasFaceText: 'Canvas face text',
  nodeFill: 'Node fill',
  nodeLabel: 'Node label',
  nodeOutlines: 'Node outlines',
  pinBg: 'Pin fill',
  pinLabel: 'Pin label',
  commentText: 'Comment text',
  highlight: 'Highlight',
  inputBg: 'Input background',
  inputText: 'Input text',
  inputBorder: 'Input border',
  darkButtonBg: 'Dark button',
  darkButtonHoverBg: 'Dark button hover',
  darkButtonText: 'Dark button text',
  lightButtonBg: 'Light button',
  lightButtonText: 'Light button text',
  selected: 'Accent / selection',
  error: 'Error',
  errorText: 'Error text',
  deployPanelBg: 'Deployment panel background',
  deployPanelText: 'Deployment panel text',
  deployPanelTitleBg: 'Deployment panel title bar',
  deployPanelTitleText: 'Deployment panel title text',
  deployPanelTabBg: 'Deployment panel tabs',
  deployPanelHoverBg: 'Deployment panel hover',
  deployPanelInputBg: 'Deployment panel input',
  deployPanelInputText: 'Deployment panel input text',
};

const COLOR_GROUPS = [
  {
    key: 'window',
    label: 'Window & Chrome',
    keys: [
      'chromeBg',
      'chromeTitleBg',
      'chromeOutlines',
      'chromeLightBg',
      'text',
    ],
  },
  {
    key: 'menubar',
    label: 'Menubar & Tabs',
    keys: [
      'menubarBg',
      'menubarText',
      'menubarActiveBg',
      'menubarActiveText',
      'menubarHoverBg',
      'tabBg',
      'tabItemBg',
      'tabText',
    ],
  },
  {
    key: 'sidebar',
    label: 'Sidebar',
    keys: [
      'sidebarBg',
      'sidebarHoverBg',
      'sidebarSelectedBg',
      'sidebarSelectedHoverBg',
      'sidebarText',
      'sidebarSubtitle',
    ],
  },
  {
    key: 'canvas',
    label: 'Canvas & Nodes',
    keys: [
      'workspaceBg',
      'canvasBg',
      'canvasGridlines',
      'canvasFace',
      'canvasFaceLight',
      'canvasFaceText',
      'nodeFill',
      'nodeLabel',
      'nodeOutlines',
      'pinBg',
      'pinLabel',
      'commentText',
      'highlight',
    ],
  },
  {
    key: 'inputs',
    label: 'Inputs & Buttons',
    keys: [
      'inputBg',
      'inputText',
      'inputBorder',
      'darkButtonBg',
      'darkButtonHoverBg',
      'darkButtonText',
      'lightButtonBg',
      'lightButtonText',
    ],
  },
  {
    key: 'deployment',
    label: 'Deployment Panel',
    keys: [
      'deployPanelBg',
      'deployPanelText',
      'deployPanelTitleBg',
      'deployPanelTitleText',
      'deployPanelTabBg',
      'deployPanelHoverBg',
      'deployPanelInputBg',
      'deployPanelInputText',
    ],
  },
  {
    key: 'status',
    label: 'Accents & Status',
    keys: ['selected', 'error', 'errorText'],
  },
];

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

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

  componentWillReceiveProps(nextProps) {
    if (!this.props.isVisible && nextProps.isVisible) {
      this.setState({
        position: null,
        hexDrafts: {},
        showColorCustomization: false,
      });
    }
    if (!R.equals(this.props.currentTheme, nextProps.currentTheme)) {
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
    if (HEX_COLOR_REGEX.test(value)) {
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

    return (
      <div className="theme-selector">
        <h3>Theme template</h3>
        <div className="theme-select">
          <label htmlFor="theme-select">Preset</label>
          <select
            id="theme-select"
            value={currentTheme}
            onChange={e => this.handleThemeChange(e.target.value)}
          >
            {R.toPairs(themes).map(([themeKey, theme]) => (
              <option key={themeKey} value={themeKey}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  renderColorGroups() {
    const { currentTheme, themes } = this.props;
    const colors = themes[currentTheme].colors;

    return (
      <div className="color-groups">
        {COLOR_GROUPS.map(group => (
          <div key={group.key} className="color-group">
            <h4>{group.label}</h4>
            <div className="color-list">
              {group.keys.map(colorKey => {
                const label = COLOR_LABELS[colorKey] || colorKey;
                const colorValue = colors[colorKey];
                const hexValue = this.state.hexDrafts[colorKey] || colorValue;

                return (
                  <div key={colorKey} className="color-item">
                    <button
                      type="button"
                      className="color-swatch"
                      style={{ backgroundColor: colorValue }}
                      aria-label={`Pick color for ${label}`}
                      title={label}
                      onClick={() => this.openColorPicker(colorKey)}
                    />
                    <span className="color-name">{label}</span>
                    <input
                      type="text"
                      className="color-hex"
                      value={hexValue}
                      aria-label={`${label} hex value`}
                      onChange={e =>
                        this.handleHexChange(colorKey, e.target.value)
                      }
                    />
                    <input
                      type="color"
                      className="color-input-hidden"
                      value={colorValue}
                      aria-label={`${label} color picker`}
                      ref={el => {
                        this.colorInputs[colorKey] = el;
                      }}
                      onChange={e =>
                        this.handleColorChange(colorKey, e.target.value)
                      }
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
    const colors = themes[currentTheme].colors;

    return (
      <div className="theme-preview">
        <div
          className="preview-panel"
          style={{
            backgroundColor: colors.chromeBg,
            color: colors.text,
          }}
        >
          <p className="preview-title">Theme preview</p>
          <p className="preview-text">
            Sample text shows how the palette colors the IDE.
          </p>
          <span
            className="preview-node"
            style={{
              color: colors.nodeLabel,
              borderColor: colors.nodeOutlines,
            }}
          >
            node
          </span>
          <span
            className="preview-error"
            style={{ color: colors.error, borderColor: colors.error }}
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
          onClick={e => e.stopPropagation()}
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

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ThemeSettingsPopup);
