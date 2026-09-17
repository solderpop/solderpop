import React from 'react';
import PropTypes from 'prop-types';
import { createStore } from 'redux';
import { setGlobalDevModeChecks } from 'reselect';

import generateReducers from '../reducer.js';
import { default as defaultInitialState } from '../state.js';
import composeMiddlewares from '../middlewares.js';

import { loadPanelSettings } from '../../editor/utils.js';
import { setSidebarLayout } from '../../editor/actions.js';

import Catcher from './Catcher.jsx';

// This codebase's selectors routinely return ramda-fantasy Maybe/Either
// values (e.g. `getCurrentTabId`) -- a fresh wrapper instance every call by
// design, even when the underlying value is unchanged. reselect v5's
// input-stability dev check assumes referential stability and warns on
// every such selector; disabling it here reflects that the "instability"
// is this codebase's actual data model, not a bug to chase down selector
// by selector.
setGlobalDevModeChecks({ inputStabilityCheck: 'never' });

export default class Root extends React.Component {
  constructor(props) {
    super(props);

    this.store = createStore(
      generateReducers(this.props.extraReducers),
      this.props.initialState,
      composeMiddlewares(this.props.extraMiddlewares)
    );
  }

  componentDidMount() {
    // dispatch actions "on init"
    this.store.dispatch(setSidebarLayout(loadPanelSettings()));
  }

  render() {
    return <Catcher store={this.store}>{this.props.children}</Catcher>;
  }
}

Root.defaultProps = {
  initialState: defaultInitialState,
  extraMiddlewares: [],
};

Root.propTypes = {
  children: PropTypes.element.isRequired,
  extraReducers: PropTypes.object,
  extraMiddlewares: PropTypes.arrayOf(PropTypes.func),
  initialState: PropTypes.object,
};
