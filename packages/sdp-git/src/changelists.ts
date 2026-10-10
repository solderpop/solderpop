import path from 'node:path';
import fs from 'fs-extra';
import { ensureSdpDir } from './sdpDir.ts';

// JetBrains-style changelists: IDE-local groupings of changed patches.
// Git never sees them; they only decide what gets ticked for a commit.

export const DEFAULT_CHANGELIST = 'Changes';

export type Changelists = {
  active: string;
  /** Changelist name -> patch paths explicitly moved into it. */
  lists: Record<string, string[]>;
};

export type ChangelistGroup<T> = {
  name: string;
  active: boolean;
  changes: T[];
};

const emptyChangelists = (): Changelists => ({
  active: DEFAULT_CHANGELIST,
  lists: { [DEFAULT_CHANGELIST]: [] },
});

const changelistsFile = (projectDir: string) =>
  path.join(projectDir, '.sdp', 'changelists.json');

const fail = (message: string, errorCode: string): never => {
  throw Object.assign(new Error(message), { errorCode });
};

const assertExists = (state: Changelists, name: string) => {
  if (!state.lists[name]) {
    fail(`Changelist "${name}" does not exist`, 'CHANGELIST_NOT_FOUND');
  }
};

const assertNewName = (state: Changelists, name: string) => {
  if (!name.trim()) {
    fail('Changelist name is empty', 'CHANGELIST_NAME_EMPTY');
  }
  if (state.lists[name]) {
    fail(`Changelist "${name}" already exists`, 'CHANGELIST_EXISTS');
  }
};

export const loadChangelists = async (
  projectDir: string
): Promise<Changelists> => {
  const file = changelistsFile(projectDir);
  if (!(await fs.pathExists(file))) {
    return emptyChangelists();
  }

  const stored: Changelists = await fs.readJson(file);
  const lists: Record<string, string[]> = {
    [DEFAULT_CHANGELIST]: [],
    ...stored.lists,
  };
  const active = lists[stored.active] ? stored.active : DEFAULT_CHANGELIST;
  return { active, lists };
};

export const saveChangelists = async (
  projectDir: string,
  state: Changelists
) => {
  await ensureSdpDir(projectDir);
  // Write-then-rename so a concurrent load never sees a half-written file.
  const file = changelistsFile(projectDir);
  const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeJson(tempFile, state, { spaces: 2 });
  await fs.rename(tempFile, file);
};

export const createChangelist = (
  state: Changelists,
  name: string
): Changelists => {
  assertNewName(state, name);
  return { ...state, lists: { ...state.lists, [name]: [] } };
};

/** Patches in the removed list fall back to the active list. */
export const removeChangelist = (
  state: Changelists,
  name: string
): Changelists => {
  assertExists(state, name);
  if (name === DEFAULT_CHANGELIST) {
    fail('The default changelist cannot be removed', 'CHANGELIST_IS_DEFAULT');
  }

  const { [name]: _removed, ...lists } = state.lists;
  const active = state.active === name ? DEFAULT_CHANGELIST : state.active;
  return { active, lists };
};

export const renameChangelist = (
  state: Changelists,
  from: string,
  to: string
): Changelists => {
  assertExists(state, from);
  if (from === DEFAULT_CHANGELIST) {
    fail('The default changelist cannot be renamed', 'CHANGELIST_IS_DEFAULT');
  }
  assertNewName(state, to);

  const lists = Object.fromEntries(
    Object.entries(state.lists).map(([name, patches]) => [
      name === from ? to : name,
      patches,
    ])
  );
  const active = state.active === from ? to : state.active;
  return { active, lists };
};

export const setActiveChangelist = (
  state: Changelists,
  name: string
): Changelists => {
  assertExists(state, name);
  return { ...state, active: name };
};

export const movePatches = (
  state: Changelists,
  patchPaths: string[],
  target: string
): Changelists => {
  assertExists(state, target);

  const lists: Record<string, string[]> = {};
  for (const [name, patches] of Object.entries(state.lists)) {
    lists[name] = patches.filter((p) => !patchPaths.includes(p));
  }
  lists[target].push(...patchPaths);
  return { ...state, lists };
};

/** Drops assignments for patches that no longer have changes. */
export const pruneChangelists = (
  state: Changelists,
  changedPatchPaths: string[]
): Changelists => {
  const lists: Record<string, string[]> = {};
  for (const [name, patches] of Object.entries(state.lists)) {
    lists[name] = patches.filter((p) => changedPatchPaths.includes(p));
  }
  return { ...state, lists };
};

/** Every list, in creation order; unassigned changes go to the active one. */
export const groupByChangelist = <T extends { patchPath: string }>(
  state: Changelists,
  changes: T[]
): ChangelistGroup<T>[] => {
  const listOf = (patchPath: string) =>
    Object.keys(state.lists).find((name) =>
      state.lists[name].includes(patchPath)
    ) ?? state.active;

  return Object.keys(state.lists).map((name) => ({
    name,
    active: name === state.active,
    changes: changes.filter((c) => listOf(c.patchPath) === name),
  }));
};
