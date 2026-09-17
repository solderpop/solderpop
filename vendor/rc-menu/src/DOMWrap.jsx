import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const DOMWrap = createReactClass({
  displayName: 'DOMWrap',

  propTypes: {
    tag: PropTypes.string,
    hiddenClassName: PropTypes.string,
    visible: PropTypes.bool,
    // A plain ref callback for the rendered DOM tag, since DOMWrap itself
    // is a class component and can't forward a `ref` prop to its own
    // child the way a forwardRef function component could -- lets callers
    // reach the real DOM node without ReactDOM.findDOMNode (removed in
    // React 19).
    domRef: PropTypes.func,
  },

  getDefaultProps() {
    return {
      tag: 'div',
    };
  },

  render() {
    const props = { ...this.props };
    if (!props.visible) {
      props.className = props.className || '';
      props.className += ` ${props.hiddenClassName}`;
    }
    const Tag = props.tag;
    delete props.tag;
    delete props.hiddenClassName;
    delete props.visible;
    const domRef = props.domRef;
    delete props.domRef;
    return <Tag ref={domRef} {...props} />;
  },
});

export default DOMWrap;
