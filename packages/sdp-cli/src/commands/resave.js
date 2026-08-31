import path from 'path';
import { stdout } from 'process';
import R from 'ramda';
import { Flags } from '@oclif/core';
import {
  loadProject,
  resolvePath,
  saveProjectAsXodball,
  saveProjectEntirely,
} from 'sdp-fs';
import { toXodball } from 'sdp-project';
import BaseCommand from '../baseCommand.js';
import * as commonArgs from '../args.js';
import * as myFlags from '../flags.js';
import { resolveBundledWorkspacePath } from '../paths.js';
import { getListr } from '../listr.js';

const { pick } = R;

class ResaveCommand extends BaseCommand {
  async run() {
    await this.parseArgv(ResaveCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { output, workspace, quiet } = this.flags;
    const { projectPath } = this.args;

    const loadProjectTask = {
      title: 'Project loading',
      task: (ctx) =>
        loadProject(
          [workspace, resolveBundledWorkspacePath()],
          projectPath
        ).then((project) => {
          ctx.project = project;
        }),
    };

    const saveToFileTask = {
      title: 'Saving...',
      skip: (ctx) => !(ctx.project && output),
      task: (ctx) =>
        (path.extname(output) === '.xodball'
          ? saveProjectAsXodball(output, ctx.project)
          : saveProjectEntirely(output, ctx.project)
        ).then(() => {
          ctx.status = `Saved to ${output}`;
        }),
    };

    await getListr(!quiet, [loadProjectTask, saveToFileTask], {
      collapse: false,
    })
      .run()
      .then(async (ctx) => {
        if (output && ctx.status) {
          this.info(ctx.status);
        }

        if (!output) {
          stdout.write(toXodball(ctx.project));
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

ResaveCommand.description =
  'opens a project and saves it in another location or format';

ResaveCommand.usage = 'resave [options] [project]';

ResaveCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['workspace'], myFlags),
  output: Flags.string({
    char: 'o',
    description:
      'xodball or multifile directory output path, defaults to stdout',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
    parse: (p) => resolvePath(p),
  }),
};

ResaveCommand.args = { project: commonArgs.project };

ResaveCommand.examples = [
  `Exports the current multifile project to a xodball\n` +
    `$ sdpc resave . -o ~/foo.xodball\n`,
  `Outputs the current multifile project as a xodball to stdout\n` +
    `$ sdpc resave\n`,
  `Resaves one xodball into another (useful for applying migrations)\n` +
    `$ sdpc resave foo.xodball -o bar.xodball\n`,
  `Converts a xodball to a multifile project\n` +
    `$ sdpc resave foo.xodball -o /some/new/dir`,
];

ResaveCommand.strict = false;

export default ResaveCommand;
