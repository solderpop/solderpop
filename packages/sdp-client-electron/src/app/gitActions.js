import electron from 'electron';
import fs from 'fs';
import * as SdpGit from 'sdp-git';

import * as EVENTS from '../shared/events.js';
import { errorToPlainObject, getPathToBundledWorkspace } from './utils.js';
import { loadWorkspacePath } from './workspaceActions.js';

const { ipcMain } = electron;

const workspaceDirs = async () => [
  await loadWorkspacePath(),
  getPathToBundledWorkspace(),
];

const unavailable = (reason) => ({ available: false, reason });

// Git needs a project directory; single-file .solderball projects can't be versioned.
const getProjectDir = (store) => {
  const projectPath = store.select.projectPath();
  if (!projectPath) {
    return null;
  }
  try {
    return fs.statSync(projectPath).isDirectory() ? projectPath : null;
  } catch {
    return null;
  }
};

const withChangelists = async (projectDir, changes) => {
  const changedPatchPaths = changes.map((c) => c.patchPath);
  const stored = await SdpGit.loadChangelists(projectDir);
  const pruned = SdpGit.pruneChangelists(stored, changedPatchPaths);
  if (JSON.stringify(pruned) !== JSON.stringify(stored)) {
    await SdpGit.saveChangelists(projectDir, pruned);
  }
  return SdpGit.groupByChangelist(pruned, changes);
};

const updateChangelists = async (projectDir, update) => {
  const state = await SdpGit.loadChangelists(projectDir);
  await SdpGit.saveChangelists(projectDir, update(state));
};

// Everything the renderer may call. `projectDir` and `root` always come from
// the main process, never from the renderer.
const createHandlers = (projectDir, root) => ({
  init: () => SdpGit.init(projectDir),

  status: async () => {
    const status = await SdpGit.status(await workspaceDirs(), projectDir);
    return {
      ...status,
      changelists: await withChangelists(projectDir, status.changes),
    };
  },

  // Committed patches drop out of their changelist on the next status prune.
  commit: async ({ message, patches, push, includeMeta }) =>
    SdpGit.commit(await workspaceDirs(), projectDir, {
      message,
      patches,
      push,
      includeMeta,
    }),

  push: () => SdpGit.pushCurrent(root),
  pull: () => SdpGit.pull(root),
  fetch: () => SdpGit.fetch(root),
  branches: () => SdpGit.branches(root),
  checkout: ({ name, create }) => SdpGit.checkout(root, name, { create }),
  shelve: ({ name }) => SdpGit.shelve(root, name),
  unshelve: ({ index }) => SdpGit.unshelve(root, index),
  shelves: () => SdpGit.shelves(root),

  createChangelist: ({ name }) =>
    updateChangelists(projectDir, (s) => SdpGit.createChangelist(s, name)),
  removeChangelist: ({ name }) =>
    updateChangelists(projectDir, (s) => SdpGit.removeChangelist(s, name)),
  renameChangelist: ({ from, to }) =>
    updateChangelists(projectDir, (s) => SdpGit.renameChangelist(s, from, to)),
  setActiveChangelist: ({ name }) =>
    updateChangelists(projectDir, (s) => SdpGit.setActiveChangelist(s, name)),
  moveToChangelist: ({ patchPaths, name }) =>
    updateChangelists(projectDir, (s) =>
      SdpGit.movePatches(s, patchPaths, name)
    ),
});

const describeRepo = async (projectDir) => {
  if (!projectDir) {
    return unavailable('Save the project as a folder to use version control');
  }
  if (!(await SdpGit.isRepo(projectDir))) {
    return { available: true, isRepo: false, projectDir };
  }

  const root = await SdpGit.repoRoot(projectDir);
  // symbolic-ref also works before the first commit; fails when detached.
  const branch = await SdpGit.git(root, ['symbolic-ref', '--short', 'HEAD'])
    .then((output) => output.trim())
    .catch(() => null);
  return { available: true, isRepo: true, projectDir, root, branch };
};

const callGit = async (store, { method, payload = {} }) => {
  const projectDir = getProjectDir(store);
  if (method === 'describe') {
    return describeRepo(projectDir);
  }
  if (!projectDir) {
    throw Object.assign(new Error('No project folder is open'), {
      errorCode: 'GIT_NO_PROJECT_DIR',
    });
  }

  const isRepo = await SdpGit.isRepo(projectDir);
  const root = isRepo ? await SdpGit.repoRoot(projectDir) : null;
  const handler = createHandlers(projectDir, root)[method];
  if (!handler) {
    throw new Error(`Unknown git method: ${method}`);
  }
  if (!isRepo && method !== 'init') {
    throw Object.assign(new Error('Project is not a Git repository'), {
      errorCode: 'GIT_NOT_A_REPO',
    });
  }
  return handler(payload);
};

// `ipcMain.handle` drops custom error fields, so errors travel as values.
export default (store) =>
  ipcMain.handle(EVENTS.GIT_CALL, (event, request) =>
    callGit(store, request).then(
      (value) => ({ ok: true, value }),
      (error) => ({ ok: false, error: errorToPlainObject(error) })
    )
  );
