export const WORKSPACE_FILENAME = '.sdp-workspace';
// Pre-rename marker name; isWorkspaceValid auto-migrates a workspace that
// still only has this to WORKSPACE_FILENAME.
export const LEGACY_WORKSPACE_FILENAME = '.xodworkspace';
export const DEFAULT_WORKSPACE_PATH = '~/sdp';
export const DEFAULT_PROJECT_NAME = 'welcome-to-xod';
export const LIBS_DIRNAME = '__lib__';

export const BASE64_EXTNAMES = ['.png', '.jpg', '.jpeg', '.gif', '.fzz'];
export const UTF8_EXTNAMES = [
  '.md',
  '.svg',
  '.tsv',
  // Implementation files
  '.c',
  '.cpp',
  '.h',
  '.inl',
  '.js',
];
export const ATTACHMENT_EXTNAMES = BASE64_EXTNAMES.concat(UTF8_EXTNAMES);

export const CHANGE_TYPES = {
  MODIFIED: 'MODIFIED',
  ADDED: 'ADDED',
  DELETED: 'DELETED',
};

export const IGNORE_FILENAMES = [
  '.*', // hidden files on Posix
  '*~', // backups
  'Thumbs.db', // Windows image file
  'desktop.ini', // Windows folder meta information
];
