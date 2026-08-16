import chai from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';

import { Project } from 'sdp-project';

import { loadProjectWithLibs } from '../src/load.js';
import pack from '../src/pack.js';

const { assert } = chai;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('welcome-to-xod', () => {
  const workspace = path.resolve(__dirname, '../../../workspace');
  const projectPath = 'welcome-to-xod';

  it('should load as a valid project', () =>
    loadProjectWithLibs([workspace], path.resolve(workspace, projectPath)).then(
      ({ project, libs }) => {
        const packed = pack(project, libs);
        assert.isAtLeast(
          Object.keys(packed.patches).length,
          1,
          'must have some patches'
        );

        const eitherValidationResult = Project.validate(packed);
        assert.isTrue(eitherValidationResult.isRight);
      }
    ));
});
