import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import client from 'sdp-client';

import callGit from './gitClient.js';

const GitContext = createContext(null);

export const useGit = () => useContext(GitContext);

/**
 * Shared Git state for the title bar widget and the Commit panel.
 * Refreshes when the project path or saved revision changes, and on window focus.
 */
export function GitProvider({
  projectPath,
  revision,
  saveProject,
  onError,
  onSuccess,
  children,
}) {
  const [repo, setRepo] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null);
  const [prompt, setPrompt] = useState(null);

  // Latest callbacks without re-creating everything that depends on them.
  const callbacks = useRef({ saveProject, onError, onSuccess });
  callbacks.current = { saveProject, onError, onSuccess };

  // Drops results of a refresh that a newer refresh has overtaken.
  const latestRefresh = useRef(0);

  const refresh = useCallback(async () => {
    const refreshId = ++latestRefresh.current;
    try {
      const nextRepo = await callGit('describe');
      const nextStatus = nextRepo.isRepo ? await callGit('status') : null;
      if (refreshId === latestRefresh.current) {
        setRepo(nextRepo);
        setStatus(nextStatus);
      }
    } catch (error) {
      callbacks.current.onError(error);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [projectPath, revision, refresh]);

  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  /** Runs a git method, then refreshes. Resolves to `null` on failure. */
  const run = useCallback(
    async (method, payload, { label, successMessage } = {}) => {
      setBusy(label || method);
      try {
        const value = await callGit(method, payload);
        if (successMessage) {
          callbacks.current.onSuccess(
            typeof successMessage === 'function'
              ? successMessage(value)
              : successMessage
          );
        }
        return value;
      } catch (error) {
        callbacks.current.onError(error);
        return null;
      } finally {
        setBusy(null);
        refresh();
      }
    },
    [refresh]
  );

  const commit = useCallback(
    async ({ patches, message, push }) => {
      await callbacks.current.saveProject();
      return run(
        'commit',
        { patches, message, push, includeMeta: true },
        {
          label: push ? 'Committing and pushing' : 'Committing',
          successMessage: (result) =>
            `Committed ${result.sha}${result.pushed ? ' and pushed' : ''}`,
        }
      );
    },
    [run]
  );

  /** Asks for a name in a popup. Resolves to the name, or `null` if cancelled. */
  const promptName = useCallback(
    ({ title, value = '', confirmText = 'OK' }) =>
      new Promise((resolve) =>
        setPrompt({ title, value, confirmText, resolve })
      ),
    []
  );

  const closePrompt = (result) => {
    prompt.resolve(result);
    setPrompt(null);
  };

  const value = {
    repo,
    status,
    busy,
    refresh,
    run,
    commit,
    promptName,
  };

  return (
    <GitContext.Provider value={value}>
      {children}
      {prompt ? (
        <client.PopupPrompt
          key={prompt.title}
          isVisible
          title={prompt.title}
          value={prompt.value}
          confirmText={prompt.confirmText}
          onConfirm={(name) => closePrompt(name.trim() || null)}
          onClose={() => closePrompt(null)}
        />
      ) : null}
    </GitContext.Provider>
  );
}

GitProvider.propTypes = {
  projectPath: PropTypes.string,
  /** Changes whenever the project is saved, to trigger a refresh. */
  revision: PropTypes.any,
  /** Saves unsaved changes before a commit; resolves when done. */
  saveProject: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  children: PropTypes.node,
};
