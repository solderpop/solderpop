import 'source-map-support/register.js';
import { fileURLToPath } from 'url';

import * as command from '@oclif/command';
import { handle } from '@oclif/errors';

// @oclif/command@1.5.6's Main.run() defaults its root-detection to
// `module.parent.parent.filename`, walking up the CJS require chain --
// there's no such thing under real ESM (bin/run uses `import`, not
// `require`), so without this it silently falls back to @oclif/command's
// *own* package directory as "root", finding none of this package's
// commands. Pass this file's own path explicitly instead of relying on
// the (CJS-only) auto-detection.
const run = command
  .run(undefined, fileURLToPath(import.meta.url))
  .then(command.flush)
  .catch(handle);

export default run;
