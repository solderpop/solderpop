// Regenerates themes/theme.schema.json from the colour registry.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { COLORS } from '../src/theme/colorRegistry.ts';

const colorProperties = Object.fromEntries(
  COLORS.map(({ key, label, description }) => [
    key,
    {
      title: label,
      description,
      type: 'string',
      pattern: '^#[0-9a-fA-F]{6}$',
      format: 'color',
    },
  ])
);

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://solderpop.io/schemas/theme.schema.json',
  title: 'SolderPop IDE theme',
  description:
    'Colour theme for the SolderPop IDE. Missing colours fall back to the built-in theme of the same "type".',
  type: 'object',
  required: ['id', 'name', 'colors'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    id: {
      description: 'Unique id; also the file name (<id>.json).',
      type: 'string',
      pattern: '^[A-Za-z0-9][A-Za-z0-9._-]*$',
    },
    name: { description: 'Name shown in the theme picker.', type: 'string' },
    author: { type: 'string' },
    version: { type: 'string' },
    type: {
      description: 'Picks the built-in theme used for any missing colour.',
      enum: ['dark', 'light'],
      default: 'dark',
    },
    colors: {
      type: 'object',
      additionalProperties: false,
      properties: colorProperties,
    },
  },
};

const out = fileURLToPath(
  new URL('../themes/theme.schema.json', import.meta.url)
);
writeFileSync(out, `${JSON.stringify(schema, null, 2)}\n`);
// eslint-disable-next-line no-console
console.log(`Wrote ${out}`);
