import { stdout } from 'process';
import R from 'ramda';
import { Flags } from '@oclif/core';
import { writeFile, resolvePath } from 'sdp-fs';

import BaseCommand from '../baseCommand.js';
import * as commonArgs from '../args.js';
import * as myFlags from '../flags.js';
import { getListr } from '../listr.js';
import {
  loadProjectTask,
  transformTask,
  transpileTask,
} from '../listrTasks.js';
import { resolveBundledWorkspacePath } from '../paths.js';

const { pick } = R;

class TranspileCommand extends BaseCommand {
  async run() {
    await this.parseArgv(TranspileCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { debug, output, quiet } = this.flags;
    const { projectPath } = this.args;
    const workspaces = [this.flags.workspace, resolveBundledWorkspacePath()];
    const patchName = this.args.patchName || '@/main';

    const saveToFileTask = (out) => ({
      title: 'Saving',
      skip: (ctx) => !(ctx.transpile && out),
      task: (ctx) =>
        writeFile(out, ctx.transpile, 'utf-8').then((r) => {
          ctx.status = `Saved to ${r.path}`;
        }),
    });

    await getListr(
      !quiet,
      [
        loadProjectTask(workspaces, projectPath),
        transformTask(patchName, debug),
        transpileTask(),
        saveToFileTask(output),
      ],
      { collapse: false }
    )
      .run()
      .then(async (ctx) => {
        if (output && ctx.status) {
          this.info(ctx.status);
        }

        if (!output) {
          stdout.write(ctx.transpile);
        }
      })
      .then(() => this.exit(0))
      .catch((err) => {
        // this.exit(0) above throws an ExitError -- an already-intentional
        // success exit, not a real failure. Let it propagate, don't re-handle it.
        if (err.oclif?.exit !== undefined) throw err;
        this.printError(err);
        return this.exit(100);
      });
  }
}

TranspileCommand.description = 'transpiles (generates C++) a XOD program';
TranspileCommand.usage = 'transpile [options] [entrypoint]';
TranspileCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['debug', 'workspace'], myFlags),
  output: Flags.string({
    char: 'o',
    description: 'C++ output file path, default to stdout',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
    parse: (p) => resolvePath(p),
  }),
};

TranspileCommand.args = { entrypoint: commonArgs.entrypoint };
TranspileCommand.examples = [
  'Transpile a program using the cwd patch as entry point, print to stdout\n' +
    '$ sdpc transpile\n',
  'Transpile the current project with `main` patch as entry point, save the output in `x.cpp`\n' +
    '$ sdpc transpile main -o x.cpp\n',
  'Transpile a project in the xodball with `main` patch as entry point\n' +
    '$ sdpc transpile foo.xodball main',
];

TranspileCommand.strict = false;

export default TranspileCommand;
