import React from 'react';
import PropTypes from 'prop-types';
import electron from 'electron';

import client, { SolderpopLockup } from 'sdp-client';

const { shell } = electron;

const openDocs = () =>
  shell.openExternal(client.getUtmSiteUrl('/docs/', 'docs', 'about'));

const openForum = () => shell.openExternal(client.getUtmForumUrl('about'));

class PopupAbout extends React.Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  render() {
    if (!this.props.isVisible) return null;

    return (
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        className="theme-window-overlay"
        onClick={this.onClose}
        role="presentation"
      >
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          className="theme-window about-window"
          role="dialog"
          aria-label="About SolderPop IDE"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="theme-window-header">
            <span className="theme-window-title">About SolderPop IDE</span>
            <button
              type="button"
              className="theme-window-close"
              aria-label="Close"
              onClick={this.onClose}
            >
              ×
            </button>
          </div>
          <div className="theme-window-body">
            <div className="about-lockup">
              <SolderpopLockup />
            </div>
            <p className="about-version">Version {this.props.version}</p>
            <p className="about-intro">
              SolderPop IDE is a visual programming environment for
              microcontrollers, built on the open-source XOD language and
              retargeted at SolderPop&apos;s ClickClack hardware line.
            </p>
            <ul className="about-links">
              <li>
                <button type="button" onClick={openDocs}>
                  Documentation
                </button>
              </li>
              <li>
                <button type="button" onClick={openForum}>
                  Forum
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

PopupAbout.propTypes = {
  isVisible: PropTypes.bool,
  version: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

PopupAbout.defaultProps = {
  isVisible: false,
};

export default PopupAbout;
