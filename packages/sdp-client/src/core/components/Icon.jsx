import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faBan,
  faChevronDown,
  faChevronUp,
  faCircleNotch,
  faCircleQuestion,
  faCopy,
  faFloppyDisk,
  faGamepad,
  faPlay,
  faStop,
  faTriangleExclamation,
  faUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';

// FA4 kebab-case names (as used throughout this codebase via the abandoned
// `react-fa` package) mapped to their FA6/7 solid-icon equivalents.
const ICONS_BY_NAME = {
  'angle-left': faAngleLeft,
  'angle-right': faAngleRight,
  ban: faBan,
  'chevron-down': faChevronDown,
  'chevron-up': faChevronUp,
  'circle-o-notch': faCircleNotch,
  copy: faCopy,
  'external-link': faUpRightFromSquare,
  gamepad: faGamepad,
  play: faPlay,
  'question-circle': faCircleQuestion,
  save: faFloppyDisk,
  stop: faStop,
  warning: faTriangleExclamation,
};

// Drop-in replacement for react-fa's <Icon>, kept to the same prop surface
// (name/spin/size/Component, plus passthrough of title/className/onClick/etc)
// so call sites didn't need to change. Renders an inline SVG instead of a
// CSS-font glyph, so any surrounding CSS written against react-fa's
// `::before` glyph convention needs updating separately.
const Icon = ({ name, Component = 'i', spin, size, ...rest }) => (
  <Component {...rest}>
    <FontAwesomeIcon icon={ICONS_BY_NAME[name]} spin={spin} size={size} />
  </Component>
);

export default Icon;
export { Icon };
