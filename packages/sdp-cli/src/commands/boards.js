import R from 'ramda';
import asTable from 'as-table';
import * as xdb from 'sdp-deploy-bin';
import BaseCommand from '../baseCommand.js';
import { resolveBundledWorkspacePath } from '../paths.js';

const { compose, concat, filter, map, none, pluck, prop, sortBy, startsWith } =
  R;

const mergeAvailableInstalled = (available, installed) => {
  const fqbns = pluck('fqbn', installed);
  return concat(
    installed,
    compose(filter((el) => none(startsWith(el.package))(fqbns)))(available)
  );
};

class BoardsCommand extends BaseCommand {
  async run() {
    await this.parseArgv(BoardsCommand);
    await this.ensureWorkspace();
    const { workspace, quiet } = this.flags;

    try {
      const sketchDir = await xdb.prepareSketchDir();
      const aCli = await xdb.createCli(
        resolveBundledWorkspacePath(),
        workspace,
        sketchDir
      );

      const boards = compose(
        map((el) => ({
          'Board Name': el.name,
          FQBN: el.fqbn || `${el.package} [not installed]`,
        })),
        sortBy(prop('name')),
        (b) => mergeAvailableInstalled(b.available, b.installed)
      )(await xdb.listBoards(resolveBundledWorkspacePath(), workspace, aCli));

      const rows = quiet
        ? map((b) => [b['Board Name'], b.FQBN])(boards)
        : boards;

      const table = process.stdout.columns
        ? asTable.configure({ maxTotalWidth: process.stdout.columns })(rows)
        : asTable(rows);
      process.stdout.write(`${table}\n`);
      return this.exit(0);
    } catch (err) {
      // this.exit(0) above throws an ExitError -- an already-intentional
      // success exit, not a real failure. Let it propagate, don't re-handle it.
      if (err.oclif?.exit !== undefined) throw err;
      this.printError(this.patchArduinoCliError(err));
      return this.exit((err.payload || err).code || 100);
    }
  }
}

BoardsCommand.description = 'show available boards';
BoardsCommand.usage = 'boards [options]';
BoardsCommand.flags = BaseCommand.flags;
BoardsCommand.args = {};
BoardsCommand.strict = false;

export default BoardsCommand;
