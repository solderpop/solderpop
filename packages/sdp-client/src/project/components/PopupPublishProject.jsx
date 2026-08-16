import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-fa';
import * as XP from 'sdp-project';

import sanctuaryPropType from '../../utils/sanctuaryPropType.js';
import PopupForm from '../../utils/components/PopupForm.jsx';
import { HOSTNAME } from '../../utils/urls.js';
import Button from '../../core/components/Button.jsx';

const PopupPublishProject = ({
  isVisible,
  isPublishing,
  project,
  user,
  onPublish,
  onRequestToEditPreferences,
  onClose,
}) => {
  const projectName = XP.getProjectName(project);
  const version = XP.getProjectVersion(project);
  const description = XP.getProjectDescription(project);
  const license = XP.getProjectLicense(project);

  // When popup is hidden, `user` could be Nothing
  const { username } = user.getOrElse({});

  const isValidName =
    XP.isValidIdentifier(projectName) && projectName.length > 0;

  const invalidNameMessage = isValidName ? null : (
    <span className="error">
      Project has no public name set.<br />
      Edit
      <a tabIndex="0" role="button" onClick={onRequestToEditPreferences}>
        project preferences
      </a>
      to set it up prior to the publishing.
    </span>
  );

  return (
    <PopupForm
      className="PopupPublishProject"
      isVisible={isVisible}
      isClosable={!isPublishing}
      title={`You are about to publish on ${HOSTNAME}`}
      onClose={onClose}
    >
      <p className="property">
        <span className="propertyLabel">Name: </span>
        <span className="libName">
          {username}/{projectName}
        </span>
        {invalidNameMessage}
      </p>
      <p className="property">
        <span className="propertyLabel">Version: </span>
        {version}
      </p>
      <p className="property">
        <span className="propertyLabel">License: </span>
        {license}
      </p>
      <p className="property">
        <span className="propertyLabel">Description: </span>
        {description}
      </p>
      {isPublishing ? (
        <div className="ModalFooter">
          <Icon name="circle-o-notch" spin size="lg" /> Publishing…
        </div>
      ) : (
        <div className="ModalFooter">
          <Button onClick={onPublish} disabled={!isValidName} autoFocus>
            Publish
          </Button>
          <Button onClick={onRequestToEditPreferences}>Edit</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
    </PopupForm>
  );
};

PopupPublishProject.propTypes = {
  isVisible: PropTypes.bool,
  isPublishing: PropTypes.bool,
  user: PropTypes.object,
  project: sanctuaryPropType(XP.Project),
  onPublish: PropTypes.func,
  onRequestToEditPreferences: PropTypes.func,
  onClose: PropTypes.func,
};

PopupPublishProject.defaultProps = {
  isVisible: false,
};

export default PopupPublishProject;
