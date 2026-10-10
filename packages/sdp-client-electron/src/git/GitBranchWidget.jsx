import React from 'react';
import PropTypes from 'prop-types';
import cls from 'classnames';
import * as remoteElectron from '@electron/remote';

import { useGit } from './GitContext.jsx';
import callGit from './gitClient.js';

const { Menu, getCurrentWindow } = remoteElectron;

const separator = { type: 'separator' };

const syncLabel = ({ ahead, behind }) => {
  const parts = [];
  if (behind) {
    parts.push(`↓${behind}`);
  }
  if (ahead) {
    parts.push(`↑${ahead}`);
  }
  return parts.join(' ');
};

// Strips the remote name so `git checkout` creates a tracking branch.
const localNameOf = (remoteBranch) => remoteBranch.replace(/^[^/]+\//, '');

const buildRepoMenu = async (git, onShowCommitPanel) => {
  const { run, promptName, status } = git;
  const [branches, shelves] = await Promise.all([
    callGit('branches'),
    callGit('shelves'),
  ]);
  const localNames = new Set(branches.local.map((b) => b.name));
  const remoteOnly = branches.remote.filter(
    (name) => !name.endsWith('/HEAD') && !localNames.has(localNameOf(name))
  );

  const newBranch = async () => {
    const name = await promptName({
      title: 'New branch',
      confirmText: 'Create',
    });
    if (name) {
      run(
        'checkout',
        { name, create: true },
        { successMessage: `Created ${name}` }
      );
    }
  };

  const shelveChanges = async () => {
    const name = await promptName({ title: 'Shelve changes', value: 'WIP' });
    if (name) {
      run('shelve', { name }, { successMessage: `Shelved "${name}"` });
    }
  };

  return [
    { label: 'Commit…', click: onShowCommitPanel },
    {
      label: 'Update Project',
      click: () =>
        run(
          'pull',
          {},
          { label: 'Pulling', successMessage: 'Project updated' }
        ),
    },
    {
      label: 'Push',
      enabled: status?.ahead !== 0,
      click: () =>
        run('push', {}, { label: 'Pushing', successMessage: 'Pushed' }),
    },
    {
      label: 'Fetch',
      click: () => run('fetch', {}, { label: 'Fetching' }),
    },
    separator,
    { label: 'New Branch…', click: newBranch },
    {
      label: 'Local Branches',
      submenu: branches.local.length
        ? branches.local.map((b) => ({
            label: b.name,
            type: 'radio',
            checked: b.current,
            click: () => !b.current && run('checkout', { name: b.name }),
          }))
        : [{ label: 'No branches yet', enabled: false }],
    },
    {
      label: 'Remote Branches',
      submenu: remoteOnly.length
        ? remoteOnly.map((name) => ({
            label: name,
            click: () => run('checkout', { name: localNameOf(name) }),
          }))
        : [{ label: 'No other remote branches', enabled: false }],
    },
    separator,
    { label: 'Shelve Changes…', click: shelveChanges },
    {
      label: 'Unshelve',
      submenu: shelves.length
        ? shelves.map((shelf, index) => ({
            label: shelf.message,
            click: () =>
              run('unshelve', { index }, { successMessage: 'Unshelved' }),
          }))
        : [{ label: 'Nothing shelved', enabled: false }],
    },
  ];
};

const buildNoRepoMenu = ({ run }) => [
  {
    label: 'Create Git Repository',
    click: () => run('init', {}, { successMessage: 'Git repository created' }),
  },
];

const disabledItem = (label) => [{ label, enabled: false }];

const buildMenu = (git, onShowCommitPanel) => {
  const { repo } = git;
  if (!repo.available) {
    return disabledItem(repo.reason);
  }
  if (!repo.isRepo) {
    return buildNoRepoMenu(git);
  }
  return buildRepoMenu(git, onShowCommitPanel).catch((error) =>
    disabledItem(`Git failed: ${error.message}`)
  );
};

const widgetLabel = (repo) => {
  if (repo.isRepo) {
    return repo.branch || 'detached HEAD';
  }
  return 'Version Control';
};

/** JetBrains-style VCS widget: current branch, opens the Git menu. */
export default function GitBranchWidget({ onShowCommitPanel }) {
  const git = useGit();
  const { repo, status, busy } = git;

  if (!repo) {
    return null;
  }

  const onClick = async (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const template = await buildMenu(git, onShowCommitPanel);
    Menu.buildFromTemplate(template).popup({
      window: getCurrentWindow(),
      x: Math.round(rect.left),
      y: Math.round(rect.bottom),
    });
  };

  const label = widgetLabel(repo);
  const sync = status ? syncLabel(status) : '';

  return (
    <button
      type="button"
      className={cls('GitBranchWidget', {
        'GitBranchWidget--unavailable': !repo.available,
      })}
      onClick={onClick}
      title={
        repo.isRepo
          ? `Git branch: ${label}`
          : repo.reason || 'Set up version control'
      }
    >
      <span className="GitBranchWidget-icon" />
      <span className="GitBranchWidget-label">{busy ? `${busy}…` : label}</span>
      {sync ? <span className="GitBranchWidget-sync">{sync}</span> : null}
      <span className="GitBranchWidget-caret">▾</span>
    </button>
  );
}

GitBranchWidget.propTypes = {
  onShowCommitPanel: PropTypes.func.isRequired,
};
