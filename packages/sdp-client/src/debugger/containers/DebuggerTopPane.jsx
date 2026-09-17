import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { $Maybe, foldMaybe, noop } from 'sdp-func-tools';
import Icon from '../../core/components/Icon.jsx';

import sanctuaryPropType from '../../utils/sanctuaryPropType.js';
import Breadcrumbs from './Breadcrumbs.jsx';
import TooltipHOC from '../../tooltip/components/TooltipHOC.jsx';

import { DEBUGGER_TAB_ID } from '../../editor/constants.js';

function DebuggerTopPane({
  currentTab,
  isDebugSessionRunning = false,
  isDebugSessionOutdated = false,
  stopDebuggerSession = noop,
}) {
  return foldMaybe(
    null,
    (tab) =>
      tab.id === DEBUGGER_TAB_ID && isDebugSessionRunning ? (
        <Breadcrumbs>
          {isDebugSessionOutdated ? (
            <TooltipHOC
              content={
                <div>
                  The program on screen is newer than the program running.
                  <br />
                  Watches and overall behavior can be incorrect. Stop debugging
                  and upload/simulate again to synchronize.
                </div>
              }
              render={(onMouseOver, onMouseMove, onMouseLeave) => (
                <div
                  className="debugging-outdated"
                  onMouseOver={onMouseOver}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                >
                  Program changed
                  <Icon name="question-circle" />
                </div>
              )}
            />
          ) : null}
          <button
            className="breadcrumbs-button Button Button--light"
            onClick={stopDebuggerSession}
          >
            <Icon name="stop" /> Stop
          </button>
        </Breadcrumbs>
      ) : null,
    currentTab
  );
}

DebuggerTopPane.propTypes = {
  currentTab: sanctuaryPropType($Maybe($.Object)),
  isDebugSessionRunning: PropTypes.bool,
  isDebugSessionOutdated: PropTypes.bool,
  stopDebuggerSession: PropTypes.func,
};

export default React.memo(
  DebuggerTopPane,
  R.eqBy(
    R.evolve({
      currentTab: foldMaybe(null, R.identity),
      stopDebuggerSession: () => null,
    })
  )
);
