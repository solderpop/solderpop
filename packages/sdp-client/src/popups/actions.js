import {
  HIDE_ALL_POPUPS,
  SHOW_PROJECT_PREFERENCES,
  HIDE_PROJECT_PREFERENCES,
  SHOW_ABOUT,
  HIDE_ABOUT,
} from './actionTypes.js';

export const hideAllPopups = () => ({
  type: HIDE_ALL_POPUPS,
});

export const showProjectPreferences = () => ({
  type: SHOW_PROJECT_PREFERENCES,
});

export const hideProjectPreferences = () => ({
  type: HIDE_PROJECT_PREFERENCES,
});

export const showAbout = () => ({
  type: SHOW_ABOUT,
});

export const hideAbout = () => ({
  type: HIDE_ABOUT,
});

export default {};
