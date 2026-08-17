import React from 'react';
import PropTypes from 'prop-types';
import { createStore } from 'redux';

import generateReducers from '../reducer.js';
import { default as defaultInitialState } from '../state.js';
import composeMiddlewares from '../middlewares.js';

import { loadPanelSettings } from '../../editor/utils.js';
import { setSidebarLayout } from '../../editor/actions.js';

import Catcher from './Catcher.jsx';

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
