import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import cls from 'classnames';
import * as remoteElectron from '@electron/remote';
import client from 'sdp-client';

import { useGit } from './GitContext.jsx';

const { Menu, getCurrentWindow } = remoteElectron;

const STATUS_BADGES = { added: 'A', modified: 'M', deleted: 'D' };

const patchName = (patchPath) => patchPath.replace(/^@\//, '');

const popupMenu = (template) =>
  Menu.buildFromTemplate(template).popup({ window: getCurrentWindow() });

// Ticks new changes when they land in the active changelist (JetBrains default)
// and forgets changes that are gone. Keeps the user's choice for the rest.
const useCheckedPatches = (changelists) => {
  const [checked, setChecked] = useState(() => new Set());
  const seen = useRef(new Set());

  useEffect(() => {
    if (!changelists) {
      return;
    }
    // Snapshot first: the updater below runs later, during the next render.
    const previouslySeen = seen.current;
    const newlyChecked = [];
    const current = new Set();
    for (const group of changelists) {
      for (const change of group.changes) {
        current.add(change.patchPath);
        if (group.active && !previouslySeen.has(change.patchPath)) {
          newlyChecked.push(change.patchPath);
        }
      }
    }
    seen.current = current;

    setChecked(
      (previous) =>
        new Set(
          [...current].filter(
            (patchPath) =>
              previous.has(patchPath) || newlyChecked.includes(patchPath)
          )
        )
    );
  }, [changelists]);

  const toggle = (patchPaths, isChecked) =>
    setChecked((previous) => {
      const next = new Set(previous);
      for (const patchPath of patchPaths) {
        if (isChecked) {
          next.add(patchPath);
        } else {
          next.delete(patchPath);
        }
      }
      return next;
    });

  return [checked, toggle];
};

function ChangeRow({ change, isChecked, onToggle, onContextMenu }) {
  const [expanded, setExpanded] = useState(false);
  const detailChanges = change.changes;

  return (
    <li className="CommitPanel-change">
      <div
        className="CommitPanel-row"
        onContextMenu={onContextMenu}
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={cls('CommitPanel-disclosure', {
            'CommitPanel-disclosure--expanded': expanded,
            'CommitPanel-disclosure--empty': detailChanges.length === 0,
          })}
        />
        <input
          type="checkbox"
          checked={isChecked}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span
          className={`CommitPanel-badge CommitPanel-badge--${change.status}`}
          title={change.status}
        >
          {STATUS_BADGES[change.status]}
        </span>
        <span className="CommitPanel-name">{patchName(change.patchPath)}</span>
        <span className="CommitPanel-summary">{change.summary}</span>
      </div>
      {expanded && detailChanges.length > 0 ? (
        <ul className="CommitPanel-details">
          {detailChanges.map((detail, index) => (
            <li
              // Changes have no stable id; the list is static per status.
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={cls({
                'CommitPanel-detail--cosmetic': detail.cosmetic,
              })}
            >
              {detail.text}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

ChangeRow.propTypes = {
  change: PropTypes.object.isRequired,
  isChecked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func.isRequired,
};

function ChangelistGroup({
  group,
  changelistNames,
  checked,
  onToggle,
  actions,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const patchPaths = group.changes.map((c) => c.patchPath);
  const checkedCount = patchPaths.filter((p) => checked.has(p)).length;
  const allChecked =
    patchPaths.length > 0 && checkedCount === patchPaths.length;

  const groupMenu = () =>
    popupMenu([
      {
        label: 'Set Active Changelist',
        enabled: !group.active,
        click: () => actions.setActive(group.name),
      },
      { label: 'New Changelist…', click: actions.create },
      { label: 'Rename…', click: () => actions.rename(group.name) },
      { label: 'Delete', click: () => actions.remove(group.name) },
    ]);

  const changeMenu = (change) => () =>
    popupMenu([
      {
        label: 'Move to Changelist',
        submenu: [
          ...changelistNames
            .filter((name) => name !== group.name)
            .map((name) => ({
              label: name,
              click: () => actions.move([change.patchPath], name),
            })),
          { type: 'separator' },
          {
            label: 'New Changelist…',
            click: () => actions.createAndMove([change.patchPath]),
          },
        ],
      },
    ]);

  return (
    <li className="CommitPanel-group">
      <div
        className="CommitPanel-row CommitPanel-groupHeader"
        onContextMenu={groupMenu}
      >
        <span
          className={cls('CommitPanel-disclosure', {
            'CommitPanel-disclosure--expanded': !collapsed,
          })}
          onClick={() => setCollapsed(!collapsed)}
        />
        <input
          type="checkbox"
          checked={allChecked}
          disabled={patchPaths.length === 0}
          ref={(el) => {
            if (el) {
              el.indeterminate = checkedCount > 0 && !allChecked;
            }
          }}
          onChange={(event) => onToggle(patchPaths, event.target.checked)}
        />
        <span
          className={cls('CommitPanel-groupName', {
            'CommitPanel-groupName--active': group.active,
          })}
          onClick={() => setCollapsed(!collapsed)}
        >
          {group.name}
        </span>
        <span className="CommitPanel-count">
          {group.changes.length}{' '}
          {group.changes.length === 1 ? 'patch' : 'patches'}
        </span>
      </div>
      {!collapsed ? (
        <ul className="CommitPanel-changes">
          {group.changes.map((change) => (
            <ChangeRow
              key={change.patchPath}
              change={change}
              isChecked={checked.has(change.patchPath)}
              onToggle={(isChecked) => onToggle([change.patchPath], isChecked)}
              onContextMenu={changeMenu(change)}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

ChangelistGroup.propTypes = {
  group: PropTypes.object.isRequired,
  changelistNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  checked: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  actions: PropTypes.objectOf(PropTypes.func).isRequired,
};

function CommitBox({ checkedPatches, canCommit }) {
  const { commit, busy } = useGit();
  const [message, setMessage] = useState('');

  const onCommit = async (push) => {
    const result = await commit({ patches: checkedPatches, message, push });
    if (result) {
      setMessage('');
    }
  };

  const disabled = !canCommit || Boolean(busy);

  return (
    <div className="CommitPanel-commitBox">
      <textarea
        className="CommitPanel-message"
        value={message}
        placeholder="Commit message (empty: suggested from the changes)"
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            onCommit(false);
          }
        }}
      />
      <div className="CommitPanel-buttons">
        <button
          type="button"
          className="Button Button--small CommitPanel-commitButton"
          disabled={disabled}
          onClick={() => onCommit(false)}
          title="Commit (Ctrl+Enter)"
        >
          Commit
        </button>
        <button
          type="button"
          className="Button Button--small"
          disabled={disabled}
          onClick={() => onCommit(true)}
        >
          Commit and Push
        </button>
      </div>
    </div>
  );
}

CommitBox.propTypes = {
  checkedPatches: PropTypes.arrayOf(PropTypes.string).isRequired,
  canCommit: PropTypes.bool.isRequired,
};

const useChangelistActions = ({ run, promptName }) => {
  const create = async () => {
    const name = await promptName({
      title: 'New changelist',
      confirmText: 'Create',
    });
    if (name) {
      await run('createChangelist', { name });
    }
    return name;
  };

  return {
    create,
    createAndMove: async (patchPaths) => {
      const name = await create();
      if (name) {
        run('moveToChangelist', { patchPaths, name });
      }
    },
    rename: async (from) => {
      const to = await promptName({ title: 'Rename changelist', value: from });
      if (to && to !== from) {
        run('renameChangelist', { from, to });
      }
    },
    remove: (name) => run('removeChangelist', { name }),
    setActive: (name) => run('setActiveChangelist', { name }),
    move: (patchPaths, name) => run('moveToChangelist', { patchPaths, name }),
  };
};

function PanelMessage({ children }) {
  return <div className="CommitPanel-placeholder">{children}</div>;
}

PanelMessage.propTypes = { children: PropTypes.node.isRequired };

/** JetBrains-style Commit tool window: changelists, changes and commit message. */
export default function CommitPanel({ sidebarId, autohide }) {
  const git = useGit();
  const { repo, status, run, refresh } = git;
  const changelists = status ? status.changelists : null;
  const [checked, toggle] = useCheckedPatches(changelists);
  const actions = useChangelistActions(git);

  const panelProps = {
    id: client.PANEL_IDS.VERSION_CONTROL,
    title: 'Commit',
    className: 'CommitPanel',
    sidebarId,
    autohide,
  };

  if (!repo || !repo.available) {
    return (
      <client.SidebarPanel {...panelProps}>
        <PanelMessage>{repo ? repo.reason : 'Loading…'}</PanelMessage>
      </client.SidebarPanel>
    );
  }

  if (!repo.isRepo) {
    return (
      <client.SidebarPanel {...panelProps}>
        <PanelMessage>
          <p>This project is not under version control yet.</p>
          <button
            type="button"
            className="Button Button--small"
            onClick={() =>
              run('init', {}, { successMessage: 'Git repository created' })
            }
          >
            Create Git Repository
          </button>
        </PanelMessage>
      </client.SidebarPanel>
    );
  }

  const checkedPatches = [...checked];
  const changeCount = changelists
    ? changelists.reduce((sum, group) => sum + group.changes.length, 0)
    : 0;
  const canCommit =
    checkedPatches.length > 0 || Boolean(status?.projectMetaChanged);

  const toolbarButtons = [
    <button
      key="newChangelist"
      type="button"
      className="newpatch"
      title="New changelist"
      onClick={actions.create}
    />,
    <button
      key="refresh"
      type="button"
      className="CommitPanel-refresh"
      title="Refresh"
      onClick={refresh}
    >
      ⟳
    </button>,
  ];

  return (
    <client.SidebarPanel
      {...panelProps}
      additionalButtons={toolbarButtons}
      footer={
        <CommitBox checkedPatches={checkedPatches} canCommit={canCommit} />
      }
    >
      <div className="CommitPanel-content">
        {changelists ? (
          <ul className="CommitPanel-groups">
            {changelists.map((group) => (
              <ChangelistGroup
                key={group.name}
                group={group}
                changelistNames={changelists.map((g) => g.name)}
                checked={checked}
                onToggle={toggle}
                actions={actions}
              />
            ))}
          </ul>
        ) : null}
        {status?.projectMetaChanged ? (
          <div className="CommitPanel-note">
            Project settings changed (always committed)
          </div>
        ) : null}
        {status?.untrackedOther.length ? (
          <div
            className="CommitPanel-note"
            title={status.untrackedOther.join('\n')}
          >
            {status.untrackedOther.length} other changed file(s), not part of
            any patch
          </div>
        ) : null}
        {status && changeCount === 0 && !status.projectMetaChanged ? (
          <PanelMessage>No changes</PanelMessage>
        ) : null}
      </div>
    </client.SidebarPanel>
  );
}

CommitPanel.propTypes = {
  sidebarId: PropTypes.string.isRequired,
  autohide: PropTypes.bool.isRequired,
};
