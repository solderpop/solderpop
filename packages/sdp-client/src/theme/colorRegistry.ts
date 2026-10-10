// Single source of truth for every themeable colour. Theme JSON files,
// the generated JSON Schema, the Theme Settings popup and the `--theme-*`
// CSS custom properties are all derived from this list -- add a colour
// here first, then use `var(--theme-…)` for it in SCSS.

export const COLOR_GROUPS = [
  { id: 'window', label: 'Window & dialogs' },
  { id: 'menubar', label: 'Menubar' },
  { id: 'tabs', label: 'Patch tabs' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'node', label: 'Nodes, pins & comments' },
  { id: 'input', label: 'Inputs & buttons' },
  { id: 'deployPanel', label: 'Deployment panel' },
  { id: 'status', label: 'Accent & status' },
] as const;

export type ColorGroupId = (typeof COLOR_GROUPS)[number]['id'];

export interface ColorDefinition<K extends string = string> {
  key: K;
  group: ColorGroupId;
  label: string;
  description: string;
}

const color = <K extends string>(
  key: K,
  group: ColorGroupId,
  label: string,
  description: string
): ColorDefinition<K> => ({ key, group, label, description });

export const COLORS = [
  color(
    'window.background',
    'window',
    'Window background',
    'Main window frame and any panel without a more specific background.'
  ),
  color(
    'window.foreground',
    'window',
    'Default text',
    'Text colour used wherever no more specific foreground is set.'
  ),
  color(
    'window.titleBar.background',
    'window',
    'Title bar',
    'Title bar strip at the top of the window and panel headers.'
  ),
  color(
    'window.border',
    'window',
    'Borders & separators',
    'Lines between panels, menubar bottom border, sidebar edges.'
  ),
  color(
    'dialog.light.background',
    'window',
    'Light dialog background',
    'Background of light modal dialogs (e.g. confirmations).'
  ),

  color(
    'menubar.background',
    'menubar',
    'Menubar background',
    'Top menubar and its dropdown menus.'
  ),
  color(
    'menubar.foreground',
    'menubar',
    'Menubar text',
    'Menu titles, dropdown items and hotkey hints.'
  ),
  color(
    'menubar.item.hover.background',
    'menubar',
    'Menu item hover',
    'Menu title or dropdown item under the mouse.'
  ),
  color(
    'menubar.item.active.background',
    'menubar',
    'Open menu background',
    'Top-level menu title while its dropdown is open.'
  ),
  color(
    'menubar.item.active.foreground',
    'menubar',
    'Open menu text',
    'Top-level menu title text while its dropdown is open.'
  ),

  color(
    'tabs.background',
    'tabs',
    'Tab strip background',
    'Strip behind the open patch tabs.'
  ),
  color(
    'tabs.item.inactive.background',
    'tabs',
    'Inactive tab',
    'Patch tabs that are not currently shown. The active tab uses the canvas background.'
  ),
  color(
    'tabs.item.hover.background',
    'tabs',
    'Tab hover',
    'Inactive patch tab under the mouse.'
  ),
  color(
    'tabs.item.foreground',
    'tabs',
    'Tab text',
    'Inactive tab titles. The active tab title uses the accent colour.'
  ),

  color(
    'sidebar.background',
    'sidebar',
    'Sidebar background',
    'Project browser, inspector and helpbox panels.'
  ),
  color(
    'sidebar.foreground',
    'sidebar',
    'Sidebar text',
    'Patch names, inspector labels and other sidebar text.'
  ),
  color(
    'sidebar.subtitle.foreground',
    'sidebar',
    'Sidebar secondary text',
    'Secondary lines such as library names and patch descriptions.'
  ),
  color(
    'sidebar.item.hover.background',
    'sidebar',
    'Sidebar row hover',
    'Project browser row under the mouse.'
  ),
  color(
    'sidebar.item.selected.background',
    'sidebar',
    'Sidebar selected row',
    'Selected project browser row.'
  ),
  color(
    'sidebar.item.selected.hover.background',
    'sidebar',
    'Sidebar selected row hover',
    'Selected project browser row under the mouse.'
  ),

  color(
    'workspace.background',
    'canvas',
    'Empty workspace',
    'Area shown when no patch is open.'
  ),
  color(
    'canvas.background',
    'canvas',
    'Canvas background',
    'Patch canvas, also used for the active patch tab.'
  ),
  color(
    'canvas.gridlines',
    'canvas',
    'Canvas grid',
    'Grid lines drawn on the patch canvas.'
  ),
  color(
    'canvas.highlight',
    'canvas',
    'Hover highlight',
    'Outline and handles of hovered nodes, pins, links and comments.'
  ),

  color(
    'node.body.background',
    'node',
    'Node body',
    'Fill of node rectangles on the canvas.'
  ),
  color(
    'node.border',
    'node',
    'Node outline',
    'Outline of nodes and the pin connectors drawn on them.'
  ),
  color(
    'node.title.foreground',
    'node',
    'Node title',
    'Node name text drawn inside the node.'
  ),
  color(
    'node.watch.foreground',
    'node',
    'Watch node value',
    'Live value text shown inside watch nodes.'
  ),
  color('node.pin.background', 'node', 'Pin fill', 'Fill of pin circles.'),
  color(
    'node.pin.label',
    'node',
    'Pin label',
    'Pin names next to pin circles.'
  ),
  color(
    'comment.foreground',
    'node',
    'Comment text',
    'Text of comment blocks on the canvas.'
  ),
  color(
    'comment.resizeHandle',
    'node',
    'Comment resize handle',
    'Corner handle used to resize comment blocks.'
  ),

  color(
    'input.background',
    'input',
    'Input background',
    'Text fields, dropdowns and inspector widgets.'
  ),
  color('input.foreground', 'input', 'Input text', 'Text typed into inputs.'),
  color(
    'input.border',
    'input',
    'Input border',
    'Border of inputs and buttons.'
  ),
  color(
    'input.option.highlighted.background',
    'input',
    'Highlighted option',
    'Keyboard-highlighted option in dropdowns and autocomplete lists.'
  ),
  color(
    'button.dark.background',
    'input',
    'Dark button',
    'Default buttons in dialogs and panels.'
  ),
  color(
    'button.dark.hover.background',
    'input',
    'Dark button hover',
    'Dark button under the mouse.'
  ),
  color(
    'button.dark.foreground',
    'input',
    'Dark button text',
    'Label of dark buttons.'
  ),
  color(
    'button.light.background',
    'input',
    'Light button',
    'Buttons on light dialogs.'
  ),
  color(
    'button.light.foreground',
    'input',
    'Light button text',
    'Label of light buttons.'
  ),

  color(
    'deployPanel.background',
    'deployPanel',
    'Panel background',
    'Deployment / debugger panel at the bottom of the window.'
  ),
  color(
    'deployPanel.foreground',
    'deployPanel',
    'Panel text',
    'Log output and labels in the deployment panel.'
  ),
  color(
    'deployPanel.titleBar.background',
    'deployPanel',
    'Panel title bar',
    'Header strip of the deployment panel.'
  ),
  color(
    'deployPanel.titleBar.foreground',
    'deployPanel',
    'Panel title text',
    'Title and toolbar icons in the deployment panel header.'
  ),
  color(
    'deployPanel.tabs.background',
    'deployPanel',
    'Panel tabs',
    'Tab strip (Installation, Compiler, Uploader, …) in the deployment panel.'
  ),
  color(
    'deployPanel.item.hover.background',
    'deployPanel',
    'Panel hover',
    'Tabs and toolbar buttons in the deployment panel under the mouse.'
  ),
  color(
    'deployPanel.input.background',
    'deployPanel',
    'Serial input background',
    'Serial monitor input field.'
  ),
  color(
    'deployPanel.input.foreground',
    'deployPanel',
    'Serial input text',
    'Text typed into the serial monitor input.'
  ),

  color(
    'accent.primary',
    'status',
    'Accent / selection',
    'Brand accent: selected nodes and links, active tab title, focused inputs.'
  ),
  color(
    'error.accent',
    'status',
    'Error',
    'Outlines, badges and backgrounds that mark errors.'
  ),
  color('error.foreground', 'status', 'Error text', 'Error message text.'),
];

export type ColorKey = (typeof COLORS)[number]['key'];

export const COLOR_KEYS: ColorKey[] = COLORS.map((c) => c.key);

// 'deployPanel.titleBar.background' -> '--theme-deploy-panel-title-bar-background'
export const toCssVar = (key: string): string =>
  `--theme-${key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '-')
    .toLowerCase()}`;
