import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'sdp-project';

import Pin from './Pin.jsx';
import PinLabel from './PinLabel.jsx';
import PinValue from './PinValue.jsx';
import { noop } from '../../utils/ramda.js';
import { isPinSelected } from '../../editor/utils.js';

import RegularNodeBody from './nodeParts/RegularNodeBody.jsx';
import TableLogNodeBody from './nodeParts/TableLogNodeBody.jsx';
import WatchNodeBody from './nodeParts/WatchNodeBody.jsx';
import TweakNodeBody from './nodeParts/TweakNodeBody.jsx';
import TerminalNodeBody from './nodeParts/TerminalNodeBody.jsx';
import ConstantNodeBody from './nodeParts/ConstantNodeBody.jsx';
import BusNodeBody from './nodeParts/BusNodeBody.jsx';
import JumperNodeBody from './nodeParts/JumperNodeBody.jsx';

import TooltipHOC from '../../tooltip/components/TooltipHOC.jsx';

import NodeHoverContext from '../../editor/nodeHoverContextType.js';
import formatErrorMessage from '../../core/formatErrorMessage.js';

const isBusNodeType = R.either(
  R.equals(XP.TO_BUS_PATH),
  R.equals(XP.FROM_BUS_PATH)
);

const renderTooltipContent = (nodeType, nodeLabel, isDeprecated, errText) =>
  R.compose(
    R.when(
      () => isDeprecated,
      R.concat([
        <div key="deprecated" className="Tooltip--deprecated">
          Deprecated
        </div>,
      ])
    ),
    R.when(
      () => !!errText,
      R.append(
        <div key="error" className="Tooltip--error">
          {errText}
        </div>
      )
    )
  )([
    <div key="nodeLabel" className="Tooltip--nodeLabel">
      {nodeLabel}
    </div>,
    <div key="nodeType" className="Tooltip--nodeType">
      {nodeType}
    </div>,
  ]);

class Node extends React.Component {
  static contextType = NodeHoverContext;

  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !R.eqBy(
      R.omit(['onMouseDown', 'onMouseUp', 'onDoubleClick']),
      newProps,
      this.props
    );
  }

  componentWillUnmount() {
    this.onMouseLeave();
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.props.id);
  }

  onMouseUp(event) {
    this.props.onMouseUp(event, this.props.id);
  }

  onDoubleClick() {
    this.props.onDoubleClick(this.props.id, this.props.type);
  }

  onMouseOver(...args) {
    return R.pathOr(noop, ['context', 'onMouseOver'], this)(...args);
  }

  onMouseLeave(...args) {
    return R.pathOr(noop, ['context', 'onMouseLeave'], this)(...args);
  }

  getHoveredNodeId() {
    return R.pathOr(null, ['context', 'nodeId'], this);
  }

  isNodeHovered() {
    return (
      this.getHoveredNodeId() === this.props.id && !this.props.noNodeHovering
    );
  }

  renderBody() {
    const { type } = this.props;

    return R.cond([
      [XP.isTerminalPatchPath, () => <TerminalNodeBody {...this.props} />],
      [XP.isWatchPatchPath, () => <WatchNodeBody {...this.props} />],
      [XP.isTableLogPatchPath, () => <TableLogNodeBody {...this.props} />],
      [XP.isConstantNodeType, () => <ConstantNodeBody {...this.props} />],
      [XP.isBindableCustomType, () => <ConstantNodeBody {...this.props} />],
      [XP.isTweakPath, () => <TweakNodeBody {...this.props} />],
      [isBusNodeType, () => <BusNodeBody {...this.props} />],
      [XP.isJumperPatchPath, () => <JumperNodeBody {...this.props} />],
      [R.T, () => <RegularNodeBody {...this.props} />],
    ])(type);
  }

  render() {
    const {
      id,
      label,
      linkingPin,
      pins,
      pxPosition,
      pxSize,
      type,
      isDragged,
      isDeprecated,
      errorRaised,
      isAffectedByErrorRaiser,
    } = this.props;

    const pinsArr = R.values(pins);

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-dragged': isDragged,
      'is-ghost': this.props.isGhost,
      'is-variadic': this.props.isVariadic,
      'is-changing-arity': this.props.isChangingArity,
      'is-errored': this.props.errors.length > 0,
      'is-error-raised': !!errorRaised,
      'is-error-affected': isAffectedByErrorRaiser,
      'is-hovered': this.isNodeHovered(),
      'is-deprecated': this.props.isDeprecated,
    });

    const pinsCls = classNames('pins', {
      'is-ghost': this.props.isGhost,
    });

    const svgStyle = {
      overflow: 'visible',
      opacity: this.props.hidden ? 0 : 1, // setting visibility is breaking masks
      pointerEvents: this.props.noEvents ? 'none' : 'auto',
    };

    const nodeLabel = label || XP.getBaseName(type);

    const isTerminalNode = XP.isTerminalPatchPath(type);

    const errMessage = R.cond([
      [
        () => this.props.errors.length > 0,
        () =>
          R.compose(
            R.join(';\n'),
            R.map(R.pipe(formatErrorMessage, R.prop('note')))
          )(this.props.errors),
      ],
      [() => !!errorRaised, R.always('Node raised an error')],
      [
        () => isAffectedByErrorRaiser,
        R.always('Node evaluation stopped by some upstream nodes'),
      ],
      [R.T, R.always(null)],
    ])();

    return (
      <TooltipHOC
        content={
          isDragged
            ? null
            : renderTooltipContent(type, nodeLabel, isDeprecated, errMessage)
        }
        render={(onMouseOver, onMouseMove, onMouseLeave) => (
          <svg
            key={id}
            style={svgStyle}
            {...pxPosition}
            {...pxSize}
            viewBox={`0 0 ${pxSize.width} ${pxSize.height}`}
            onMouseOver={(...args) => {
              onMouseOver(...args);
              this.onMouseOver(id);
            }}
            onMouseMove={onMouseMove}
            onMouseLeave={(...args) => {
              onMouseLeave(...args);
              this.onMouseLeave();
            }}
          >
            <g
              className={cls}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
              onDoubleClick={this.onDoubleClick}
              id={id}
              data-label={nodeLabel} // for func tests
            >
              {this.renderBody()}
            </g>
            <g className={pinsCls} id={`nodePins_${id}`}>
              {pinsArr.map((pin) => (
                <g key={pin.key}>
                  {pin.isConnected || XP.isOutputPin(pin) ? null : (
                    <PinValue {...pin} key={`pinValue_${pin.key}`} />
                  )}
                  {isTerminalNode ? null : (
                    <PinLabel {...pin} key={`pinlabel_${pin.key}`} />
                  )}
                  <Pin
                    {...pin}
                    isSelected={isPinSelected(linkingPin, pin)}
                    isAcceptingLinks={this.props.pinLinkabilityValidator(pin)}
                    keyName={pin.key}
                    key={`pin_${pin.key}`}
                  />
                </g>
              ))}
            </g>
          </svg>
        )}
      />
    );
  }
}

Node.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  pxSize: PropTypes.any.isRequired,
  pxPosition: PropTypes.object.isRequired,
  errors: PropTypes.arrayOf(PropTypes.instanceOf(Error)),
  isDeprecated: PropTypes.bool,
  isSelected: PropTypes.bool,
  isGhost: PropTypes.bool,
  isDragged: PropTypes.bool,
  isVariadic: PropTypes.bool,
  isChangingArity: PropTypes.bool,
  hidden: PropTypes.bool,
  noEvents: PropTypes.bool,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onDoubleClick: PropTypes.func,
  noNodeHovering: PropTypes.bool,
  errorRaised: PropTypes.bool,
  isAffectedByErrorRaiser: PropTypes.bool,
};

Node.defaultProps = {
  errors: [],
  isDeprecated: false,
  isSelected: false,
  isGhost: false,
  isDragged: false,
  isVariadic: false,
  isChangingArity: false,
  noEvents: false,
  onMouseDown: noop,
  onMouseUp: noop,
  onDoubleClick: noop,
  pinLinkabilityValidator: R.F,
  noNodeHovering: false,
  isAffectedByErrorRaiser: false,
  errorRaised: false,
};

export default Node;
