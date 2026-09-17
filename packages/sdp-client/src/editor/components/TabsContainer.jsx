import React from 'react';
import normalizeWheel from 'normalize-wheel';
import PropTypes from 'prop-types';

class TabsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.isOverflowed = false;
    this.domElement = null;
    this.resizeObserver = null;

    this.setRef = this.setRef.bind(this);
    this.checkOverflow = this.checkOverflow.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    this.checkOverflow();
    this.resizeObserver = new ResizeObserver(this.checkOverflow);
    if (this.domElement) this.resizeObserver.observe(this.domElement);
  }

  componentDidUpdate() {
    this.checkOverflow();
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  setRef(domElement) {
    this.domElement = domElement;
    this.props.forwardedRef(domElement);
  }

  checkOverflow() {
    if (!this.domElement) return;

    const isOverflowed =
      this.domElement.scrollWidth > this.domElement.clientWidth;

    if (isOverflowed !== this.isOverflowed) {
      this.isOverflowed = isOverflowed;
      this.props.onOverflowChange(isOverflowed);
    }
  }

  handleScroll(event) {
    const normalizedWheel = normalizeWheel(event);

    if (normalizedWheel.pixelX === 0) {
      this.domElement.scrollLeft += normalizedWheel.pixelY;
    }
  }

  render() {
    return (
      <ul
        ref={this.setRef}
        className="TabsContainer"
        onWheel={this.handleScroll}
      >
        {this.props.children}
      </ul>
    );
  }
}

TabsContainer.propTypes = {
  forwardedRef: PropTypes.func.isRequired,
  onOverflowChange: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
};

export default TabsContainer;
