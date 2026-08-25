import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { foldMaybe } from 'sdp-func-tools';

import { PANEL_IDS, SIDEBAR_IDS } from '../../editor/constants.js';

import SidebarPanel from '../../editor/components/SidebarPanel.jsx';
import Button from '../../core/components/Button.jsx';
import * as Actions from '../actions.js';
import * as Selectors from '../selectors.js';

import AuthForm from '../components/AuthForm.jsx';

const AccountPane = ({
  sidebarId,
  autohide,
  user,
  compilationsLeft,
  actions,
  isAuthorising,
}) => (
  <SidebarPanel
    id={PANEL_IDS.ACCOUNT}
    className="AccountPane"
    title="Account"
    sidebarId={sidebarId}
    autohide={autohide}
  >
    <div className="AccountPane-content">
      <div className="login-info">
        {foldMaybe(
          <div className="username">Guest Xoder</div>,
          ({ username }) => [
            <div className="introduction" key="introduction">
              Logged in as
            </div>,
            <div className="username" key="username">
              {username}
            </div>,
          ],
          user
        )}
      </div>

      <div className="cloudLimits">
        <div className="title">Cloud limits</div>
        <div>
          Compilations:{' '}
          {compilationsLeft == null ? 'currently offline' : compilationsLeft}
        </div>
      </div>

      {foldMaybe(
        <AuthForm onLogin={actions.login} isAuthorising={isAuthorising} />,
        () => <Button onClick={actions.logout}>Logout</Button>,
        user
      )}
    </div>
  </SidebarPanel>
);

AccountPane.propTypes = {
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  compilationsLeft: PropTypes.number,
  user: PropTypes.object,
  isAuthorising: PropTypes.bool.isRequired,
  actions: PropTypes.shape({
    login: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
  }),
};

const mapStateToProps = R.applySpec({
  user: Selectors.getUser,
  compilationsLeft: Selectors.getCompileLimitLeft,
  isAuthorising: Selectors.isAuthorising,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      login: Actions.login,
      logout: Actions.logout,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountPane);
