import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'sdp-client';

class WelcomeDialog extends React.Component {
  constructor(props) {
    super(props);

    // Opt-in, not opt-out: unchecked by default so nobody gets a
    // ~300 MB download just for opening the IDE to look around.
    this.state = { enableSimulation: false };

    this.onClose = this.onClose.bind(this);
    this.onContinue = this.onContinue.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  onToggle() {
    this.setState(state => ({ enableSimulation: !state.enableSimulation }));
  }

  onContinue() {
    if (this.state.enableSimulation) {
      this.props.onInstallClick();
    }
    this.onClose();
  }

  render() {
    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Welcome to SolderPop IDE"
        onClose={this.onClose}
      >
        <div className="ModalContent">
          <p>
            SolderPop IDE lets you build and simulate circuits visually.
          </p>
          <label>
            <input
              type="checkbox"
              checked={this.state.enableSimulation}
              onChange={this.onToggle}
            />{' '}
            Enable local circuit simulation — downloads the Emscripten
            toolchain (~300 MB). You can turn this on later too, from the
            Deploy menu.
          </label>
        </div>
        <div className="ModalFooter">
          <button onClick={this.onContinue} className="Button">
            Continue
          </button>
        </div>
      </PopupForm>
    );
  }
}

WelcomeDialog.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onInstallClick: PropTypes.func.isRequired,
};

WelcomeDialog.defaultProps = {
  isVisible: false,
};

export default WelcomeDialog;
