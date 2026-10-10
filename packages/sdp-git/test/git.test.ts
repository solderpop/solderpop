import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import * as SdpProject from 'sdp-project';
import { loadProject, saveProjectEntirely } from 'sdp-fs';
import * as SdpGit from '../src/index.ts';

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);
const WS = path.join(REPO, 'workspace');

test('semantic status, partial commit, log, shelve, local history', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-git-'));
  const dir = path.join(tmp, 'blink');
  await fs.copy(path.join(WS, 'blink'), dir);
  await fs.remove(path.join(dir, '__fixtures__'));
  const wss = [WS];
  const author = { name: 'T', email: 't@t' };

  await SdpGit.init(dir);
  assert.equal(await SdpGit.isRepo(dir), true);

  const st0 = await SdpGit.status(wss, dir);
  assert.equal(st0.hasCommits, false);
  assert.equal(st0.changes[0].status, 'added');

  const c0 = await SdpGit.commit(wss, dir, { message: 'init', author });
  assert.ok(c0.sha);

  // edit: change IVAL on the clock, add a second patch
  let p = await loadProject(wss, dir);
  const main = SdpProject.getPatchByPathUnsafe('@/main', p);
  const clock = SdpProject.listNodes(main).find(
    (node: object) => SdpProject.getNodeType(node) === 'xod/core/clock'
  );
  const ival = Object.values(SdpProject.getPinsForNode(clock, main, p)).find(
    (x) => SdpProject.getPinLabel(x) === 'IVAL'
  );
  p = SdpProject.assocPatch(
    '@/main',
    SdpProject.assocNode(
      SdpProject.setBoundValue(SdpProject.getPinKey(ival), '0.1', clock),
      main
    ),
    p
  );
  p = SdpProject.assocPatch(
    '@/extra',
    SdpProject.setPatchPath('@/extra', SdpProject.createPatch()),
    p
  );
  await saveProjectEntirely(dir, p);

  const st1 = await SdpGit.status(wss, dir, p);
  const byPath = Object.fromEntries(st1.changes.map((c) => [c.patchPath, c]));
  assert.equal(byPath['@/extra'].status, 'added');
  assert.equal(byPath['@/main'].status, 'modified');
  assert.ok(
    byPath['@/main'].changes.some(
      (c) => c.kind === 'value-changed' && /0\.1/.test(c.text)
    )
  );
  assert.match(st1.suggestedMessage, /Tune values in main|Add extra/);

  // partial commit: only @/extra
  const c1 = await SdpGit.commit(wss, dir, {
    patches: ['@/extra'],
    author,
    includeMeta: false,
  });
  assert.deepEqual(c1.patches, ['@/extra']);
  const st2 = await SdpGit.status(wss, dir);
  assert.deepEqual(
    st2.changes.map((c) => c.patchPath),
    ['@/main']
  );

  // diff main between HEAD and working tree
  const d = await SdpGit.diffPatchBetween(wss, dir, '@/main');
  assert.ok(d.changes.some((c) => c.kind === 'value-changed'));

  // shelve / unshelve
  await SdpGit.shelve(st2.root, 'wip ival');
  assert.equal((await SdpGit.status(wss, dir)).changes.length, 0);
  assert.equal((await SdpGit.shelves(st2.root)).length, 1);

  await SdpGit.unshelve(st2.root, 0);
  assert.equal((await SdpGit.status(wss, dir)).changes.length, 1);

  // branches + log
  await SdpGit.checkout(st2.root, 'feature/x', { create: true });
  const br = await SdpGit.branches(st2.root);
  assert.equal(br.local.find((b) => b.current)?.name, 'feature/x');

  const lg = await SdpGit.log(st2.root, { limit: 5 });
  assert.equal(lg.length, 2);
  assert.equal(lg[0].subject, 'Add extra');

  // local history
  const snap = await SdpGit.localHistory.snapshot(dir, p, { label: 'save' });
  const hist = await SdpGit.localHistory.list(dir);
  assert.equal(hist[0].id, snap.id);

  const head = await SdpGit.loadProjectAt(wss, dir, 'HEAD');
  const hd = await SdpGit.localHistory.diff(dir, snap.id, head);
  assert.ok(hd.some((c) => c.patchPath === '@/main'));

  await fs.remove(tmp);
});
