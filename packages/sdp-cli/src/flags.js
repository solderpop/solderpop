import { Flags } from '@oclif/core';

export const help = Flags.help({
  char: 'h',
});

export const version = Flags.version({
  char: 'V',
});

export const api = Flags.string({
  description: 'SDP API hostname',
  env: 'XOD_API',
  default: 'solderpop.io',
  helpValue: 'hostname',
});

export const board = Flags.string({
  char: 'b',
  description: 'target board identifier (see `sdpc boards` output)',
  env: 'XOD_BOARD',
  required: true,
  helpValue: 'fqbn',
});

export const debug = Flags.boolean({
  description: 'enable debug traces',
  env: 'XOD_DEBUG',
  default: false,
});

export const onBehalf = Flags.string({
  description: 'publish on behalf of the username',
  env: 'XOD_ONBEHALF',
  helpValue: 'username',
});

export const password = Flags.string({
  description: 'SDP API password',
  env: 'XOD_PASSWORD',
  helpValue: 'password',
});

export const quiet = Flags.boolean({
  char: 'q',
  description: 'do not log messages other than errors',
  default: false,
});

export const username = Flags.string({
  description: 'SDP API username',
  env: 'XOD_USERNAME',
  helpValue: 'username',
});

export const workspace = Flags.string({
  char: 'w',
  description: 'use the workspace specified, defaults to $HOME/xod',
  env: 'XOD_WORKSPACE',
  helpValue: 'path',
  default: '~/xod',
});
