import R from 'ramda';
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { enquote, unquote } from 'sdp-func-tools';
import cls from 'classnames';

import PinWidget from './PinWidget.jsx';

const isStringModeValue = R.startsWith('"');

const requote = R.pipe(unquote, enquote);

function StringWidget(props) {
  const [focused, setFocus] = useState(false);
  // We have to handle input's selection in a tricky way, because we're
  // changing it's value on focus
  const [selection, setSelection] = useState([0, 0]);
  const inputRef = useRef(null);
  const [isStringMode, setStringMode] = useState(() =>
    isStringModeValue(props.value)
  );

  // We have to handle it in case we just added a leading quote before the
  // literal
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(selection[0], selection[1]);
    }
  }, [selection]);

  const onChangeHandler = (event) => {
    const { value } = event.target;
    props.onChange(isStringMode ? enquote(value) : value);
  };

  const onKeyDown = (event) => {
    if (event.target.selectionStart === 0 && event.target.selectionEnd === 0) {
      // Backspace
      // If it deletes a "virtual" quote — exit the string mode
      if (event.keyCode === 8 && isStringMode) {
        event.preventDefault();
        setStringMode(false);
        props.onChange(event.target.value);
        return;
      }
      // Quote
      // If it was not a string mode — enter it and do not place an extra quote
      // In other cases — it will place an extra quote
      if (event.keyCode === 222 && !isStringMode) {
        event.preventDefault();
        setStringMode(true);
        props.onChange(requote(event.target.value));
        return;
      }
    }

    props.onKeyDown(event);
  };

  const onFocus = (event) => {
    setSelection([event.target.selectionStart, event.target.selectionEnd]);
    setFocus(true);
  };

  const onBlur = () => {
    setFocus(false);
    setSelection([0, 0]);
    props.onBlur();
  };

  const showQuotes = focused && isStringMode;
  const wrapperClassNames = cls('inspector-input-wrapper', {
    'with-fake-quotes': showQuotes,
  });
  const value = showQuotes ? unquote(props.value) : props.value;

  return (
    <PinWidget
      elementId={props.elementId}
      label={props.label}
      dataType={props.dataType}
      isConnected={props.isConnected}
      isInvalid={props.isInvalid}
      deducedType={props.deducedType}
      isLastVariadicGroup={props.isLastVariadicGroup}
      isBindable={props.isBindable}
      direction={props.direction}
    >
      <span className={wrapperClassNames}>
        <input
          className="inspectorTextInput"
          type="text"
          id={props.elementId}
          value={value}
          onChange={onChangeHandler}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          spellCheck={false}
          ref={inputRef}
        />
      </span>
    </PinWidget>
  );
}

StringWidget.propTypes = {
  elementId: PropTypes.string.isRequired,
  label: PropTypes.string,
  dataType: PropTypes.string,
  isConnected: PropTypes.bool,
  isInvalid: PropTypes.bool,
  isLastVariadicGroup: PropTypes.bool,
  isBindable: PropTypes.bool,
  deducedType: PropTypes.object,
  direction: PropTypes.string,

  value: PropTypes.string,
  onBlur: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
};

StringWidget.defaultProps = {
  label: 'Unnamed property',
  value: '',
  disabled: false,
};

export default StringWidget;
