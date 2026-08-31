import { Args } from '@oclif/core';
import fs from 'fs-extra';
import * as xdb from 'sdp-deploy-bin';
import BaseCommand from '../../baseCommand.js';
import { resolveBundledWorkspacePath } from '../../paths.js';

class InstallArchCommand extends BaseCommand {
  async run() {
    await this.parseArgv(InstallArchCommand);
    await this.ensureWorkspace();
    const { workspace } = this.flags;
    const { fqbn } = this.args;

    // accumulate arduino-cli messages to this variable
    const messages = [];

    try {
      const sketchDir = await xdb.prepareSketchDir();
      const aCli = await xdb.createCli(
        resolveBundledWorkspacePath(),
        workspace,
        sketchDir
      );
      await aCli.core.install((progress) => {
        if (progress.message !== null) messages.push(progress.message);
        this.printArduinoCliProgress(progress);
      }, fqbn);
      await fs.remove(sketchDir);
      this.info('Done!');
      return this.exit(0);
    } catch (err) {
      // this.exit(0) above throws an ExitError -- an already-intentional
      // success exit, not a real failure. Let it propagate, don't re-handle it.
      if (err.oclif?.exit !== undefined) throw err;
      if (messages) this.info(messages.join('\n'));
      this.printError(this.patchArduinoCliError(err));
      return this.exit((err.payload || err).code || 100);
    }
  }
}

InstallArchCommand.description = 'install toolchains';

InstallArchCommand.usage = 'install:arch [fqbn]';

InstallArchCommand.flags = BaseCommand.flags;

InstallArchCommand.args = {
  fqbn: Args.string({
    required: true,
    hidden: false,
    description:
      'Board FQBN. `arduino:sam` for example. See `sdpc boards` list for the full list.',
  }),
};

InstallArchCommand.strict = true;

export default InstallArchCommand;
