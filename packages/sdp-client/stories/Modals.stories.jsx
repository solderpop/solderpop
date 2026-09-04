import React from 'react';
import { SkyLightStateless } from 'react-skylight';
import { Line as ProgressBar } from 'rc-progress';

import '../src/core/styles/main.scss';

export default {
  title: 'Modal (SkyLight)',
  decorators: [(Story) => <div><Story /></div>],
};

export const Default = () => (
  <SkyLightStateless isVisible title="Popup title">
    The actual content is not styled
  </SkyLightStateless>
);

export const Unclosable = () => (
  <SkyLightStateless isVisible isClosable={false} title="Popup title">
    You cant close me! Ha-ha-ha!
  </SkyLightStateless>
);

export const WithSomeContent = () => (
  <SkyLightStateless isVisible title="Popup title">
    <div className="ModalBody">
      <div className="ModalContent">
        Spawn new workspace in <code>~/xod</code>?
      </div>
      <div className="ModalFooter">
        <button className="Button">Ok</button>
        <button className="Button">Cancel</button>
      </div>
    </div>
  </SkyLightStateless>
);

export const WithSomeLightContent = () => (
  <SkyLightStateless isVisible title="Popup title">
    <div className="ModalBody ModalBody--light">
      <div className="ModalContent">
        Spawn new workspace in <code>~/xod</code>?
      </div>
      <div className="ModalFooter">
        <button className="Button Button--light">Ok</button>
        <button className="Button Button--light">Cancel</button>
      </div>
    </div>
  </SkyLightStateless>
);

export const WithSomeCode = () => (
  <SkyLightStateless isVisible title="Transpiled code">
    <textarea className="Codebox" value="console.log('Hello world');" />
    <div className="ModalBody ModalBody--light">
      <div className="ModalFooter">
        <button className="Button Button--light">Copy</button>
      </div>
    </div>
  </SkyLightStateless>
);

export const WithAForm = () => (
  <SkyLightStateless isVisible title="Create new patch">
    <form>
      <div className="ModalBody">
        <div className="ModalContent">
          Enter the new patch name
          <input
            className="inspectorTextInput"
            style={{ display: 'block', width: '100%' }}
            autoFocus
          />
          <span className="helpText">Here are some validation rules</span>
        </div>
        <div className="ModalFooter">
          <button type="submit" className="Button">
            Create
          </button>
          <button className="Button">Cancel</button>
        </div>
      </div>
    </form>
  </SkyLightStateless>
);

export const WithMixedContent = () => (
  <SkyLightStateless isVisible title="Setup Arduino IDE">
    <div className="ModalBody ModalBody--light">
      <div className="ModalContent">
        <p>
          <strong>Could not find Arduino IDE executable.</strong>
        </p>
        <p>
          <button className="Button Button--light">
            Point to installed Arduino IDE
          </button>
        </p>
        <hr />
        <p>
          <strong>Don&apos;t have an installed Arduino IDE?</strong>
          <br />
          You need an installed Arduino IDE to compile and upload XOD programs
          to Arduino boards.
        </p>
        <button className="Button Button--light">
          Download & install Arduino IDE
        </button>
      </div>
    </div>
  </SkyLightStateless>
);

export const WithProjectSelectorDark = () => (
  <SkyLightStateless isVisible title="Select project">
    <div className="ModalBody ModalBody">
      <div className="ModalContent">
        <ul className="ProjectList">
          <li className="project">
            <button>
              <p className="name">my-project</p>
              <p className="path">
                <span>Path:</span>
                ~/my-workspace/my-project
              </p>
            </button>
          </li>
          <li className="project">
            <button>
              <p className="name">xello-xorld</p>
              <p className="path">
                <span>Path:</span>
                ~/my-workspace/xello-xorld
              </p>
            </button>
          </li>
          <li className="error">
            <div>
              <p className="path">
                <span>Path:</span>
                ~/my-workspace/oops
              </p>
              <p className="message">Something is wrong with this project!</p>
            </div>
          </li>
          <li className="project">
            <button>
              <p className="name">my-other-project</p>
              <p className="path">
                <span>Path:</span>
                ~/my-workspace/my-other-project
              </p>
            </button>
          </li>
        </ul>
      </div>
      <div className="ModalFooter">
        <button className="Button Button">Switch workspace</button>
        <button className="Button Button">Create new project</button>
      </div>
    </div>
  </SkyLightStateless>
);

export const WithProgressBar = () => (
  <SkyLightStateless isVisible title="Uploading to Arduino">
    <div className="ModalBody">
      <ProgressBar
        percent={50}
        strokeWidth="5"
        strokeColor="#80c422"
        strokeLinecap="square"
        trailWidth="5"
        trailColor="#373737"
        className="ProgressBar"
      />
      <div className="ModalFooter">something is going on</div>
    </div>
  </SkyLightStateless>
);
