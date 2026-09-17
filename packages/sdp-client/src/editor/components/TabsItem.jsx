import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

class TabsItem extends React.Component {
  constructor(props) {
    super(props);

    this.ref = null;
    this.setRef = this.setRef.bind(this);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.scrollIntoView = this.scrollIntoView.bind(this);
  }

  componentDidMount() {
    if (this.props.data.isActive) {
      setTimeout(this.scrollIntoView, 10);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.data.isActive && !prevProps.data.isActive) {
      setTimeout(this.scrollIntoView, 10);
    }
  }

  setRef(ref) {
    this.ref = ref;
    if (this.props.dndRef) this.props.dndRef(ref);
  }

  scrollIntoView() {
    if (!this.ref) return;

    scrollIntoView(this.ref, {
      scrollMode: 'if-needed',
      behavior: 'smooth',
      duration: 100,
      block: 'nearest',
      inline: 'nearest',
      // don't scroll the whole window
      boundary: this.ref.parentElement,
    });
  }

  handleMouseDown(event) {
    this.scrollIntoView();
    this.props.onClick(this.props.data.id, event);
  }

  handleClose(event) {
    event.stopPropagation();
    this.props.onClose(this.props.data.id);
  }

  render() {
    const { type, label, isActive } = this.props.data;
    const { style, dndAttributes, dndListeners, isSorting } = this.props;

    return (
      <li
        ref={this.setRef}
        style={style}
        className={cn('TabsItem', `TabsItem--${type}`, {
          'is-active': isActive,
          'is-sorting': isSorting,
        })}
        onMouseDown={this.handleMouseDown}
        {...dndAttributes}
        {...dndListeners}
      >
        <span className="tab-name">{label}</span>
        <span className="tab-close" onMouseDown={this.handleClose}>
          &times;
        </span>
      </li>
    );
  }
}

const TabsDataPropType = PropTypes.shape({
  id: PropTypes.string,
  patchPath: PropTypes.string,
  type: PropTypes.string,
  index: PropTypes.number,
  label: PropTypes.string,
  isActive: PropTypes.boolean,
});

TabsItem.propTypes = {
  data: TabsDataPropType,
  onClick: PropTypes.func,
  onClose: PropTypes.func,
  dndRef: PropTypes.func,
  style: PropTypes.object,
  dndAttributes: PropTypes.object,
  dndListeners: PropTypes.object,
  isSorting: PropTypes.bool,
};

export default TabsItem;
