import _extends from 'babel-runtime/helpers/extends';
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

var DOMWrap = createReactClass({
  displayName: 'DOMWrap',

  propTypes: {
    tag: PropTypes.string,
    hiddenClassName: PropTypes.string,
    visible: PropTypes.bool,
    domRef: PropTypes.func
  },

  getDefaultProps: function getDefaultProps() {
    return {
      tag: 'div'
    };
  },
  render: function render() {
    var props = _extends({}, this.props);
    if (!props.visible) {
      props.className = props.className || '';
      props.className += ' ' + props.hiddenClassName;
    }
    var Tag = props.tag;
    delete props.tag;
    delete props.hiddenClassName;
    delete props.visible;
    var domRef = props.domRef;
    delete props.domRef;
    return React.createElement(Tag, _extends({ ref: domRef }, props));
  }
});

export default DOMWrap;