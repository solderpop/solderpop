import React from 'react';

import * as XP from 'sdp-project';

import '../src/core/styles/main.scss';
import PatchDocs from '../src/editor/components/PatchDocs.jsx';

// The 6 real-stdlib-patch story variants this file used to have (ordinary
// node, large node, etc.) were dropped along with the `sdp-client-browser`
// dependency they relied on (`tutorialProject.json`, a build-generated
// fixture) -- that created a circular package dependency
// (sdp-client -> sdp-client-browser -> sdp-client), which pnpm tolerated
// but turborepo's build graph can't. No test covered those variants.
// The terminal-patch stories below are unaffected: xod/patch-nodes/* are
// sdp-project's own built-ins, not external stdlib content.

const emptyProject = XP.createProject();

export default { title: 'PatchDocs' };

export const InputTerminal = () => (
  <PatchDocs
    patch={XP.getPatchByPathUnsafe('xod/patch-nodes/input-pulse', emptyProject)}
  />
);

export const OutputTerminal = () => (
  <PatchDocs
    patch={XP.getPatchByPathUnsafe(
      'xod/patch-nodes/output-number',
      emptyProject
    )}
  />
);

export const ToBus = () => (
  <PatchDocs
    patch={XP.getPatchByPathUnsafe('xod/patch-nodes/to-bus', emptyProject)}
  />
);

export const FromBus = () => (
  <PatchDocs
    patch={XP.getPatchByPathUnsafe('xod/patch-nodes/from-bus', emptyProject)}
  />
);
