import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'sdp-client';

import { checkEmsdkInstalled, uninstallEmsdk } from '../runners.js';

class ManageLocalSimulationPopup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      installed: null,
      uninstalling: false,
    };

    this.onClose = this.onClose.bind(this);
    this.checkStatus = this.checkStatus.bind(this);
    this.onInstallClick = this.onInstallClick.bind(this);
    this.onUninstallClick = this.onUninstallClick.bind(this);
  }

  componentDidMount() {
    this.checkStatus();
  }

  onClose() {
    this.props.onClose();
  }

  checkStatus() {
    this.setState({ installed: null });
    checkEmsdkInstalled().then(installed => this.setState({ installed }));
  }

  onInstallClick() {
    this.props.onInstallClick();
    this.onClose();
  }

  onUninstallClick() {
    this.setState({ uninstalling: true });
    uninstallEmsdk()
      .then(this.checkStatus)
      .finally(() => this.setState({ uninstalling: false }));
  }

  renderStatus() {
    const { installed, uninstalling } = this.state;
    if (installed === null) {
      return <span>Checking status…</span>;
    }
    if (uninstalling) {
      return <span>Uninstalling…</span>;
    }
    if (installed) {
      return <span>The Emscripten toolchain is installed.</span>;
    }
    return (
      <span>
        Not installed. Simulate needs it to compile locally (~300 MB
        download).
      </span>
    );
  }

  render() {
    const { installed, uninstalling } = this.state;
    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Local Simulation"
        onClose={this.onClose}
      >
        <div className="ModalContent">{this.renderStatus()}</div>
        <div className="ModalFooter">
          {installed ? (
            <button
              onClick={this.onUninstallClick}
              className="Button"
              disabled={uninstalling}
            >
              Uninstall
            </button>
          ) : (
            <button
              onClick={this.onInstallClick}
              className="Button"
              disabled={installed === null}
            >
              Download &amp; Install
            </button>
          )}
        </div>
      </PopupForm>
    );
  }
}

ManageLocalSimulationPopup.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onInstallClick: PropTypes.func.isRequired,
};

ManageLocalSimulationPopup.defaultProps = {
  isVisible: false,
};

export default ManageLocalSimulationPopup;
