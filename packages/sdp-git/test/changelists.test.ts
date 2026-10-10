import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import {
  DEFAULT_CHANGELIST,
  loadChangelists,
  saveChangelists,
  createChangelist,
  removeChangelist,
  renameChangelist,
  setActiveChangelist,
  movePatches,
  pruneChangelists,
  groupByChangelist,
} from '../src/changelists.ts';

const changes = [{ patchPath: '@/main' }, { patchPath: '@/extra' }];

test('unassigned changes go to the active changelist', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-git-cl-'));
  let state = await loadChangelists(tmp);
  assert.equal(state.active, DEFAULT_CHANGELIST);

  state = setActiveChangelist(createChangelist(state, 'Refactor'), 'Refactor');
  state = movePatches(state, ['@/main'], DEFAULT_CHANGELIST);
  const groups = groupByChangelist(state, changes);

  assert.deepEqual(
    groups.map((g) => [g.name, g.active, g.changes.map((c) => c.patchPath)]),
    [
      [DEFAULT_CHANGELIST, false, ['@/main']],
      ['Refactor', true, ['@/extra']],
    ]
  );

  await saveChangelists(tmp, state);
  assert.deepEqual(await loadChangelists(tmp), state);
  await fs.remove(tmp);
});

test('rename, remove and prune keep state consistent', () => {
  let state = createChangelist(
    { active: DEFAULT_CHANGELIST, lists: { [DEFAULT_CHANGELIST]: [] } },
    'WIP'
  );
  state = movePatches(setActiveChangelist(state, 'WIP'), ['@/extra'], 'WIP');
  state = renameChangelist(state, 'WIP', 'Blink tweaks');
  assert.equal(state.active, 'Blink tweaks');
  assert.deepEqual(state.lists['Blink tweaks'], ['@/extra']);

  assert.deepEqual(pruneChangelists(state, []).lists['Blink tweaks'], []);

  state = removeChangelist(state, 'Blink tweaks');
  assert.equal(state.active, DEFAULT_CHANGELIST);
  assert.deepEqual(Object.keys(state.lists), [DEFAULT_CHANGELIST]);

  assert.throws(() => removeChangelist(state, DEFAULT_CHANGELIST), {
    errorCode: 'CHANGELIST_IS_DEFAULT',
  });
  assert.throws(() => createChangelist(state, DEFAULT_CHANGELIST), {
    errorCode: 'CHANGELIST_EXISTS',
  });
});
