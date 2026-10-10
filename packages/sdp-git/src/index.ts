import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify, isDeepStrictEqual } from 'node:util';
import fs from 'fs-extra';
import * as SdpProject from 'sdp-project';
import * as SdpFs from 'sdp-fs';

const execFileAsync = promisify(execFile);

// sdp-project ships no types; these are opaque values passed back into it.
type Project = object;
type Patch = object;
type PatchNode = object;
type Link = object;
type Maybe<T> = { isJust: boolean; value: T };

const PROJECT_FILENAMES: string[] = [
  SdpFs.PROJECT_FILENAME,
  ...SdpFs.LEGACY_PROJECT_FILENAMES,
];
const SNAPSHOT_EXT = '.solderball';

// ---------------------------------------------------------------------------
// Low-level git
// ---------------------------------------------------------------------------

type GitOptions = { env?: NodeJS.ProcessEnv };

export const git = async (
  cwd: string,
  args: string[],
  options: GitOptions = {}
): Promise<string> => {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      ...options,
    });
    return stdout;
  } catch (err) {
    const execError = err as Error & {
      stderr?: string;
      stdout?: string;
      code?: number | string;
    };
    const message = String(
      execError.stderr || execError.stdout || execError.message
    ).trim();
    throw Object.assign(new Error(message), {
      errorCode: 'GIT_FAILED',
      payload: { args, cwd, code: execError.code },
    });
  }
};

const succeeds = (promise: Promise<unknown>): Promise<boolean> =>
  promise.then(
    () => true,
    () => false
  );

export const isRepo = (dir: string) =>
  succeeds(git(dir, ['rev-parse', '--is-inside-work-tree']));

export const repoRoot = async (dir: string) =>
  (await git(dir, ['rev-parse', '--show-toplevel'])).trim();

const currentBranch = async (root: string) =>
  (await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();

export const init = async (dir: string, { initialBranch = 'main' } = {}) => {
  await git(dir, ['init', '-b', initialBranch]);
  const gitignorePath = path.join(dir, '.gitignore');
  if (!(await fs.pathExists(gitignorePath))) {
    const ignored = [
      '__build__/',
      '.sdp/',
      '*.hex',
      '*.bin',
      '*.elf',
      '.DS_Store',
    ];
    await fs.writeFile(gitignorePath, `${ignored.join('\n')}\n`);
  }
  return { initialized: dir };
};

// ---------------------------------------------------------------------------
// Semantic diff between two patches (nodes, links, values, description)
// ---------------------------------------------------------------------------

export type ChangeKind =
  | 'node-added'
  | 'node-removed'
  | 'node-retyped'
  | 'node-relabeled'
  | 'node-moved'
  | 'value-changed'
  | 'link-added'
  | 'link-removed'
  | 'description-changed';

export type Change = {
  kind: ChangeKind;
  text: string;
  nodeId?: string;
  linkId?: string;
  pinKey?: string;
  cosmetic?: boolean;
};

const indexBy = <T>(items: T[], getKey: (item: T) => string) =>
  Object.fromEntries(items.map((item) => [getKey(item), item])) as Record<
    string,
    T
  >;

const keysOfBoth = (a: object, b: object) => [
  ...new Set([...Object.keys(a), ...Object.keys(b)]),
];

const nodesById = (patch: Patch | null) =>
  patch
    ? indexBy<PatchNode>(SdpProject.listNodes(patch), SdpProject.getNodeId)
    : {};

const linksById = (patch: Patch | null) =>
  patch ? indexBy<Link>(SdpProject.listLinks(patch), SdpProject.getLinkId) : {};

const describeNode = (node: PatchNode): string => {
  const typeName = SdpProject.getNodeType(node).split('/').pop();
  const label = SdpProject.getNodeLabel(node);
  return label ? `${typeName} "${label}"` : typeName;
};

const describeLink = (link: Link, nodes: Record<string, PatchNode>) => {
  const fromNode = nodes[SdpProject.getLinkOutputNodeId(link)];
  const toNode = nodes[SdpProject.getLinkInputNodeId(link)];
  const describe = (node?: PatchNode) => (node ? describeNode(node) : '?');
  return `${describe(fromNode)} -> ${describe(toNode)}`;
};

const diffNode = (
  nodeId: string,
  nodeBefore: PatchNode,
  nodeAfter: PatchNode
): Change[] => {
  const changes: Change[] = [];

  const typeBefore = SdpProject.getNodeType(nodeBefore);
  const typeAfter = SdpProject.getNodeType(nodeAfter);
  if (typeBefore !== typeAfter) {
    changes.push({
      kind: 'node-retyped',
      nodeId,
      text: `~ ${describeNode(nodeBefore)} => ${typeAfter}`,
    });
  }

  const labelBefore = SdpProject.getNodeLabel(nodeBefore);
  const labelAfter = SdpProject.getNodeLabel(nodeAfter);
  if (labelBefore !== labelAfter) {
    changes.push({
      kind: 'node-relabeled',
      nodeId,
      text: `~ label "${labelBefore}" -> "${labelAfter}"`,
    });
  }

  const valuesBefore = SdpProject.getAllBoundValues(nodeBefore);
  const valuesAfter = SdpProject.getAllBoundValues(nodeAfter);
  for (const pinKey of keysOfBoth(valuesBefore, valuesAfter)) {
    const valueBefore = valuesBefore[pinKey] ?? '(default)';
    const valueAfter = valuesAfter[pinKey] ?? '(default)';
    if (valueBefore !== valueAfter) {
      changes.push({
        kind: 'value-changed',
        nodeId,
        pinKey,
        text: `~ ${describeNode(nodeAfter)}.${pinKey}: ${valueBefore} -> ${valueAfter}`,
      });
    }
  }

  if (
    !isDeepStrictEqual(
      SdpProject.getNodePosition(nodeBefore),
      SdpProject.getNodePosition(nodeAfter)
    )
  ) {
    changes.push({
      kind: 'node-moved',
      nodeId,
      text: `· moved ${describeNode(nodeAfter)}`,
      cosmetic: true,
    });
  }

  return changes;
};

/** `null` on either side means the patch doesn't exist there. */
export const diffPatches = (
  before: Patch | null,
  after: Patch | null
): Change[] => {
  const changes: Change[] = [];
  const nodesBefore = nodesById(before);
  const nodesAfter = nodesById(after);
  const linksBefore = linksById(before);
  const linksAfter = linksById(after);

  for (const [nodeId, node] of Object.entries(nodesAfter)) {
    if (!nodesBefore[nodeId]) {
      changes.push({
        kind: 'node-added',
        nodeId,
        text: `+ ${describeNode(node)}`,
      });
    }
  }

  for (const [nodeId, node] of Object.entries(nodesBefore)) {
    if (!nodesAfter[nodeId]) {
      changes.push({
        kind: 'node-removed',
        nodeId,
        text: `- ${describeNode(node)}`,
      });
    }
  }

  for (const [nodeId, nodeAfter] of Object.entries(nodesAfter)) {
    const nodeBefore = nodesBefore[nodeId];
    if (nodeBefore) {
      changes.push(...diffNode(nodeId, nodeBefore, nodeAfter));
    }
  }

  // Removed links point at removed nodes, so look them up in both sides.
  const allNodes = { ...nodesBefore, ...nodesAfter };

  for (const [linkId, link] of Object.entries(linksAfter)) {
    if (!linksBefore[linkId]) {
      changes.push({
        kind: 'link-added',
        linkId,
        text: `+ link ${describeLink(link, allNodes)}`,
      });
    }
  }

  for (const [linkId, link] of Object.entries(linksBefore)) {
    if (!linksAfter[linkId]) {
      changes.push({
        kind: 'link-removed',
        linkId,
        text: `- link ${describeLink(link, allNodes)}`,
      });
    }
  }

  if (
    before &&
    after &&
    SdpProject.getPatchDescription(before) !==
      SdpProject.getPatchDescription(after)
  ) {
    changes.push({
      kind: 'description-changed',
      text: '~ description changed',
    });
  }

  return changes;
};

// ---------------------------------------------------------------------------
// Semantic diff between two projects
// ---------------------------------------------------------------------------

export type PatchStatus = 'added' | 'deleted' | 'modified';
export type PatchDiff = {
  patchPath: string;
  status: PatchStatus;
  cosmeticOnly: boolean;
  changes: Change[];
  summary: string;
};

const countByKind = (changes: Change[]) => {
  const counts: Partial<Record<ChangeKind, number>> = {};
  for (const change of changes) {
    counts[change.kind] = (counts[change.kind] ?? 0) + 1;
  }
  return counts;
};

const substantive = (changes: Change[]) => changes.filter((c) => !c.cosmetic);

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count > 1 ? 's' : ''}`;

const getPatchStatus = (
  patchBefore: Patch | null,
  patchAfter: Patch | null
): PatchStatus => {
  if (!patchBefore) {
    return 'added';
  }
  if (!patchAfter) {
    return 'deleted';
  }
  return 'modified';
};

const summarizeModifications = (changes: Change[]) => {
  const counts = countByKind(substantive(changes));
  const parts = [
    counts['node-added'] && `+${plural(counts['node-added'], 'node')}`,
    counts['node-removed'] && `-${plural(counts['node-removed'], 'node')}`,
    (counts['link-added'] || counts['link-removed']) && 'rewired',
    counts['value-changed'] && plural(counts['value-changed'], 'value'),
    counts['node-retyped'] && 'retyped',
    counts['description-changed'] && 'description',
  ].filter(Boolean);

  if (!parts.length && changes.length) {
    return 'layout only';
  }

  return parts.join(', ');
};

const summarizeChanges = (status: PatchStatus, changes: Change[]): string => {
  switch (status) {
    case 'added':
      return 'new patch';
    case 'deleted':
      return 'deleted';
    case 'modified':
      return summarizeModifications(changes);
  }
};

const patchesByPath = (project: Project | null) =>
  project
    ? indexBy<Patch>(
        SdpProject.listLocalPatches(project),
        SdpProject.getPatchPath
      )
    : {};

/** `null` on either side means an empty project (e.g. no commits yet). */
export const diffProjects = (
  before: Project | null,
  after: Project | null
): PatchDiff[] => {
  const patchesBefore = patchesByPath(before);
  const patchesAfter = patchesByPath(after);
  const result: PatchDiff[] = [];

  for (const patchPath of keysOfBoth(patchesBefore, patchesAfter).sort()) {
    const patchBefore = patchesBefore[patchPath] ?? null;
    const patchAfter = patchesAfter[patchPath] ?? null;
    const status = getPatchStatus(patchBefore, patchAfter);
    const changes = diffPatches(patchBefore, patchAfter);
    if (status === 'modified' && changes.length === 0) {
      continue;
    }

    result.push({
      patchPath,
      status,
      cosmeticOnly: status === 'modified' && substantive(changes).length === 0,
      changes,
      summary: summarizeChanges(status, changes),
    });
  }
  return result;
};

// ---------------------------------------------------------------------------
// Commit message suggestion
// ---------------------------------------------------------------------------

// Checked in priority order: the first match names the commit.
const describeModification = (name: string, changes: Change[]) => {
  const counts = countByKind(substantive(changes));
  const addedNodeTypes = changes
    .filter((c) => c.kind === 'node-added')
    .map((c) => c.text.replace(/^\+ /, '').split(' ')[0]);

  if (addedNodeTypes.length && addedNodeTypes.length <= 3) {
    return `Add ${addedNodeTypes.join(', ')} to ${name}`;
  }
  if (
    counts['value-changed'] &&
    !counts['node-added'] &&
    !counts['link-added']
  ) {
    return `Tune values in ${name}`;
  }
  if (counts['link-added'] || counts['link-removed']) {
    return `Rewire ${name}`;
  }

  return `Update ${name}`;
};

const describePatchDiff = (patchDiff: PatchDiff): string => {
  const name = patchDiff.patchPath.replace(/^@\//, '');
  switch (patchDiff.status) {
    case 'added':
      return `Add ${name}`;
    case 'deleted':
      return `Remove ${name}`;
    case 'modified':
      return describeModification(name, patchDiff.changes);
  }
};

/** Commit message proposal from a semantic diff (JetBrains-style "smart" default). */
export const suggestMessage = (patchDiffs: PatchDiff[]): string => {
  const meaningfulDiffs = patchDiffs.filter((d) => !d.cosmeticOnly);
  if (!meaningfulDiffs.length) {
    return patchDiffs.length ? 'Tidy layout' : '';
  }

  const titleParts = meaningfulDiffs.map(describePatchDiff);
  const title =
    titleParts.length <= 2
      ? titleParts.join('; ')
      : `${titleParts[0]}; ${titleParts.length - 1} more changes`;

  const body = meaningfulDiffs
    .flatMap((d) => [
      `${d.patchPath}:`,
      ...substantive(d.changes).map((c) => `  ${c.text}`),
    ])
    .join('\n');

  return `${title}\n\n${body}`;
};

// ---------------------------------------------------------------------------
// Loading a project at a revision
// ---------------------------------------------------------------------------

/** Project as it is at `rev` (HEAD, a sha, a branch), or `null` if absent there. */
export const loadProjectAt = async (
  workspaces: string[],
  projectDir: string,
  rev = 'HEAD'
): Promise<Project | null> => {
  const root = await repoRoot(projectDir);
  const projectRelPath = path.relative(root, projectDir) || '.';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-git-'));
  try {
    const { stdout: tarball } = await execFileAsync(
      'git',
      ['archive', '--format=tar', rev, projectRelPath],
      { cwd: root, encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 }
    );
    await fs.writeFile(path.join(tempDir, 'snapshot.tar'), tarball);
    await execFileAsync('tar', ['-xf', 'snapshot.tar'], { cwd: tempDir });

    const extractedDir = path.join(tempDir, projectRelPath);
    const hasProjectFile = await Promise.all(
      PROJECT_FILENAMES.map((name) =>
        fs.pathExists(path.join(extractedDir, name))
      )
    );
    if (!hasProjectFile.includes(true)) {
      return null;
    }

    return await SdpFs.loadProject(workspaces, extractedDir);
  } catch (err) {
    const { stderr, message } = err as Error & { stderr?: Buffer };
    const revisionMissing =
      /did not match any files|unknown revision|not a valid object/i;
    if (revisionMissing.test(String(stderr || message))) {
      return null;
    }
    throw err;
  } finally {
    await fs.remove(tempDir);
  }
};

// ---------------------------------------------------------------------------
// Status / commit / push / pull
// ---------------------------------------------------------------------------

const patchDirOf = (projectDir: string, patchPath: string) =>
  path.join(projectDir, SdpProject.getBaseName(patchPath));

type ChangedFile = { statusCode: string; filePath: string };

/** Parses `git status --porcelain=v1 -z`. */
const parsePorcelain = (output: string): ChangedFile[] => {
  const entries = output.split('\0').filter(Boolean);
  const files: ChangedFile[] = [];
  for (let i = 0; i < entries.length; i++) {
    const statusCode = entries[i].slice(0, 2);
    files.push({ statusCode, filePath: entries[i].slice(3) });
    // Renames/copies are followed by an extra entry holding the original path.
    if (/[RC]/.test(statusCode)) {
      i++;
    }
  }
  return files;
};

const countCommits = (root: string, range: string) =>
  git(root, ['rev-list', '--count', range])
    .then((output) => Number(output.trim()))
    .catch(() => null);

export type PatchDiffWithFiles = PatchDiff & {
  /** Repo-relative files backing this patch, so the UI can stage a subset. */
  files: string[];
};

export type Status = {
  root: string;
  branch: string;
  /** `null` when the branch has no upstream. */
  ahead: number | null;
  behind: number | null;
  hasCommits: boolean;
  changes: PatchDiffWithFiles[];
  projectMetaChanged: boolean;
  /** Repo-relative path of the changed project file, if any. */
  projectFile: string | null;
  /** Changed files that belong to neither a patch nor the project file. */
  untrackedOther: string[];
  suggestedMessage: string;
};

/** JetBrains-like "Changes" view: semantic per-patch changes plus backing files. */
export const status = async (
  workspaces: string[],
  projectDir: string,
  currentProject?: Project
): Promise<Status> => {
  const root = await repoRoot(projectDir);
  const projectRelPath = path.relative(root, projectDir);
  const changedFiles = parsePorcelain(
    await git(root, [
      'status',
      '--porcelain=v1',
      '-z',
      '--',
      projectRelPath || '.',
    ])
  );

  const headProject = await loadProjectAt(workspaces, projectDir, 'HEAD');
  const workingProject =
    currentProject || (await SdpFs.loadProject(workspaces, projectDir));

  const changes = diffProjects(headProject, workingProject).map((patchDiff) => {
    const patchDirRelPath = path.relative(
      root,
      patchDirOf(projectDir, patchDiff.patchPath)
    );
    const files = changedFiles
      .map((f) => f.filePath)
      .filter(
        (f) => f === patchDirRelPath || f.startsWith(`${patchDirRelPath}/`)
      );
    return { ...patchDiff, files };
  });

  const projectFilePaths = PROJECT_FILENAMES.map((name) =>
    path.join(projectRelPath, name)
  );
  const projectFile =
    changedFiles.find((f) => projectFilePaths.includes(f.filePath))?.filePath ??
    null;

  const filesOwnedByPatches = new Set(changes.flatMap((c) => c.files));
  const untrackedOther = changedFiles
    .map((f) => f.filePath)
    .filter((f) => !filesOwnedByPatches.has(f) && f !== projectFile);

  return {
    root,
    branch: await currentBranch(root).catch(() => 'HEAD'),
    ahead: await countCommits(root, '@{u}..HEAD'),
    behind: await countCommits(root, 'HEAD..@{u}'),
    hasCommits:
      headProject !== null ||
      (await succeeds(git(root, ['rev-parse', 'HEAD']))),
    changes,
    projectMetaChanged: projectFile !== null,
    projectFile,
    untrackedOther,
    suggestedMessage: suggestMessage(changes),
  };
};

export type Author = { name: string; email: string };

export type CommitOptions = {
  message?: string;
  /** Patch paths to include; default all changed. */
  patches?: string[];
  /** Include the project file when it changed. */
  includeMeta?: boolean;
  push?: boolean;
  author?: Author;
};

const authorEnv = (author?: Author): NodeJS.ProcessEnv =>
  author
    ? {
        ...process.env,
        GIT_AUTHOR_NAME: author.name,
        GIT_AUTHOR_EMAIL: author.email,
        GIT_COMMITTER_NAME: author.name,
        GIT_COMMITTER_EMAIL: author.email,
      }
    : process.env;

/** Commit a subset of patches (JetBrains: tick the changes you want). */
export const commit = async (
  workspaces: string[],
  projectDir: string,
  {
    message,
    patches,
    includeMeta = true,
    push = false,
    author,
  }: CommitOptions = {}
) => {
  const currentStatus = await status(workspaces, projectDir);
  const { root, projectFile } = currentStatus;
  const selectedChanges = currentStatus.changes.filter(
    (c) => !patches || patches.includes(c.patchPath)
  );
  const includeProjectFile = includeMeta && projectFile !== null;

  if (!selectedChanges.length && !includeProjectFile) {
    throw Object.assign(new Error('Nothing selected to commit'), {
      errorCode: 'NOTHING_TO_COMMIT',
    });
  }

  const pathsToStage = selectedChanges.flatMap((c) =>
    c.files.length
      ? c.files
      : [path.relative(root, patchDirOf(projectDir, c.patchPath))]
  );
  if (includeProjectFile) {
    pathsToStage.push(projectFile);
  }

  // Start from a clean index so only the ticked changes go in.
  await git(root, ['reset', '-q']);
  await git(root, ['add', '-A', '--', ...pathsToStage]);

  const commitMessage =
    message || suggestMessage(selectedChanges) || 'Update project';
  await git(root, ['commit', '-q', '-m', commitMessage], {
    env: authorEnv(author),
  });

  const sha = (await git(root, ['rev-parse', '--short', 'HEAD'])).trim();
  return {
    sha,
    message: commitMessage,
    patches: selectedChanges.map((c) => c.patchPath),
    pushed: push ? await pushCurrent(root) : null,
  };
};

export const pushCurrent = async (root: string) => {
  const branch = await currentBranch(root);
  const hasUpstream = await succeeds(
    git(root, ['rev-parse', '--abbrev-ref', '@{u}'])
  );
  await git(
    root,
    hasUpstream ? ['push', '-q'] : ['push', '-q', '-u', 'origin', branch]
  );
  return { branch, upstream: hasUpstream ? 'existing' : `origin/${branch}` };
};

export const pull = async (root: string, { rebase = true } = {}) => {
  await git(root, ['pull', '-q', ...(rebase ? ['--rebase'] : [])]);
  return { pulled: true };
};

export const fetch = async (root: string) => {
  await git(root, ['fetch', '-q', '--all', '--prune']);
  return { fetched: true };
};

// ---------------------------------------------------------------------------
// History / branches
// ---------------------------------------------------------------------------

// ASCII unit/record separators: can't appear in commit messages.
const FIELD_SEP = '\x1f';
const RECORD_SEP = '\x1e';

export type LogEntry = {
  sha: string;
  shortSha: string;
  author: string;
  date: string;
  subject: string;
  body: string;
};

export const log = async (
  root: string,
  {
    limit = 30,
    patchPath,
    projectDir,
  }: { limit?: number; patchPath?: string; projectDir?: string } = {}
): Promise<LogEntry[]> => {
  const format = ['%H', '%h', '%an', '%aI', '%s', '%b'].join('%x1f') + '%x1e';
  const args = ['log', `-n${limit}`, `--format=${format}`];
  if (patchPath && projectDir) {
    args.push('--', path.relative(root, patchDirOf(projectDir, patchPath)));
  }
  const output = await git(root, args).catch(() => '');
  return output
    .split(RECORD_SEP)
    .filter((record) => record.trim())
    .map((record) => {
      const [sha, shortSha, author, date, subject, body = ''] = record
        .replace(/^\n/, '')
        .split(FIELD_SEP);
      return { sha, shortSha, author, date, subject, body: body.trim() };
    });
};

const nonEmptyLines = (output: string) => output.split('\n').filter(Boolean);

export const branches = async (root: string) => {
  const localOutput = await git(root, [
    'branch',
    '--format=%(refname:short)%09%(HEAD)%09%(upstream:short)%09%(objectname:short)',
  ]);
  const local = nonEmptyLines(localOutput).map((line) => {
    const [name, headMarker, upstream, sha] = line.split('\t');
    return {
      name,
      current: headMarker === '*',
      upstream: upstream || null,
      sha,
    };
  });

  const remoteOutput = await git(root, [
    'branch',
    '-r',
    '--format=%(refname:short)',
  ]).catch(() => '');
  return { local, remote: nonEmptyLines(remoteOutput) };
};

export const checkout = async (
  root: string,
  name: string,
  { create = false } = {}
) => {
  await git(root, ['checkout', '-q', ...(create ? ['-b'] : []), name]);
  return { branch: name, created: create };
};

// ---------------------------------------------------------------------------
// Shelve (git stash) — JetBrains "Shelve changes"
// ---------------------------------------------------------------------------

export const shelve = async (root: string, name?: string) => {
  await git(root, ['stash', 'push', '-u', '-q', ...(name ? ['-m', name] : [])]);
  return { shelved: name || 'stash' };
};

export const unshelve = async (root: string, index = 0) => {
  await git(root, ['stash', 'pop', '-q', `stash@{${index}}`]);
  return { unshelved: index };
};

export const shelves = async (root: string) => {
  const output = await git(root, [
    'stash',
    'list',
    '--format=%gd%x1f%s%x1f%cI',
  ]);
  return nonEmptyLines(output).map((line) => {
    const [ref, message, date] = line.split(FIELD_SEP);
    return { ref, message, date };
  });
};

/** Semantic diff of one patch between two revisions (default HEAD vs working tree). */
export const diffPatchBetween = async (
  workspaces: string[],
  projectDir: string,
  patchPath: string,
  {
    from = 'HEAD',
    to = null,
    currentProject,
  }: { from?: string; to?: string | null; currentProject?: Project } = {}
) => {
  const fromProject = await loadProjectAt(workspaces, projectDir, from);
  const toProject = to
    ? await loadProjectAt(workspaces, projectDir, to)
    : currentProject || (await SdpFs.loadProject(workspaces, projectDir));

  const patchIn = (project: Project | null): Patch | null => {
    if (!project) {
      return null;
    }
    const maybePatch: Maybe<Patch> = SdpProject.getPatchByPath(
      patchPath,
      project
    );
    return maybePatch.isJust ? maybePatch.value : null;
  };

  return {
    patchPath,
    from,
    to: to || 'working tree',
    changes: diffPatches(patchIn(fromProject), patchIn(toProject)),
  };
};

// ---------------------------------------------------------------------------
// Local History (JetBrains): automatic snapshots independent of git
// ---------------------------------------------------------------------------

const historyDir = (projectDir: string) =>
  path.join(projectDir, '.sdp', 'history');

const listSnapshotFiles = async (dir: string) =>
  (await fs.readdir(dir)).filter((f) => f.endsWith(SNAPSHOT_EXT)).sort();

// Snapshot ids are `<ISO timestamp with : and . replaced by ->_<label>`.
const timestampFromId = (id: string) =>
  id
    .split('_')[0]
    .replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d+)Z?$/,
      '$1T$2:$3:$4.$5Z'
    );

export const localHistory = {
  /** Snapshot the current project (call on every save). Keeps the newest `keep`. */
  snapshot: async (
    projectDir: string,
    project: Project,
    { label = 'save', keep = 200 } = {}
  ) => {
    const dir = historyDir(projectDir);
    await fs.ensureDir(dir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeLabel = label.replace(/[^a-z0-9_-]/gi, '_');
    const id = `${timestamp}_${safeLabel}`;
    await fs.writeFile(
      path.join(dir, `${id}${SNAPSHOT_EXT}`),
      SdpProject.toSolderball(project)
    );

    const snapshots = await listSnapshotFiles(dir);
    const expired = snapshots.slice(0, Math.max(0, snapshots.length - keep));
    await Promise.all(expired.map((file) => fs.remove(path.join(dir, file))));
    return { id, dir };
  },

  /** Newest first. */
  list: async (projectDir: string) => {
    const dir = historyDir(projectDir);
    if (!(await fs.pathExists(dir))) {
      return [];
    }
    return (await listSnapshotFiles(dir)).reverse().map((file) => {
      const id = file.slice(0, -SNAPSHOT_EXT.length);
      const label = id.split('_').slice(1).join('_');
      return { id, date: timestampFromId(id), label };
    });
  },

  load: async (projectDir: string, id: string): Promise<Project> => {
    const file = path.join(historyDir(projectDir), `${id}${SNAPSHOT_EXT}`);
    const data = await fs.readFile(file, 'utf8');
    return SdpProject.fromSolderballDataUnsafe(JSON.parse(data));
  },

  /** Semantic diff between a snapshot and the given project. */
  diff: async (
    projectDir: string,
    id: string,
    currentProject: Project | null
  ) => diffProjects(await localHistory.load(projectDir, id), currentProject),
};
