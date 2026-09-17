import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SkyLightStateless } from 'react-skylight';

import { noop } from '../ramda.js';
import { KEYCODE } from '../constants.js';

function PopupAlert({
  title,
  children,
  closeText,
  className,
  onClose,
  isClosable,
  isVisible,
}) {
  const wrapperClassNames = classNames('PopupAlert', className);
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
        <div className="ModalBody">
          <div className="ModalContent">{children}</div>
          {isClosable ? (
            <div className="ModalFooter">
              <button
                className="Button Button--primary"
                onClick={onClose}
                autoFocus
              >
                {closeText}
              </button>
            </div>
          ) : null}
        </div>
      </SkyLightStateless>
    </div>
  );
}

PopupAlert.propTypes = {
  title: PropTypes.string,
  children: PropTypes.any,
  closeText: PropTypes.string,
  className: PropTypes.string,
  onClose: PropTypes.func,
  isClosable: PropTypes.bool,
  isVisible: PropTypes.bool,
};
PopupAlert.defaultProps = {
  title: 'Alert!',
  closeText: 'Okay',
  className: '',
  onClose: noop,
  isClosable: true,
  isVisible: true,
};

export default PopupAlert;
