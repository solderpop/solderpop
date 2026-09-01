import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';

import { noop } from '../ramda.js';
import { KEYCODE } from '../constants.js';

function PopupForm({
  title,
  children,
  className,
  onClose,
  isClosable,
  isVisible,
}) {
  const wrapperClassNames = classNames('PopupForm', className);
  const onCloseClicked = isClosable ? onClose : noop;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isVisible) return;

      const keycode = event.keycode || event.which;
      if (keycode === KEYCODE.ESCAPE) {
        onCloseClicked();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isVisible, onCloseClicked]);

  return (
    <div className={wrapperClassNames}>
      <SkyLightStateless
        isVisible={isVisible}
        title={title}
        isClosable={isClosable}
        onCloseClicked={onCloseClicked}
        onOverlayClicked={onCloseClicked}
      >
        <div className="ModalBody">{children}</div>
      </SkyLightStateless>
    </div>
  );
}

PopupForm.propTypes = {
  title: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
  onClose: PropTypes.func,
  isClosable: PropTypes.bool,
  isVisible: PropTypes.bool,
};
PopupForm.defaultProps = {
  title: 'Fill the form',
  className: '',
  onClose: noop,
  isClosable: true,
  isVisible: true,
};

export default PopupForm;
