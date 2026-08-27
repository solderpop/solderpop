// Entry point for NODE_OPTIONS="--import ./tools/registerJsxLoader.mjs" --
// see jsxEsmLoader.mjs for why this exists. `module.register()` is the
// actual API that installs a customization hook; passing the hook file
// itself via --import does not (its exported `load`/`resolve` functions
// are never picked up that way, only through explicit registration).
import { register } from 'node:module';

register('./jsxEsmLoader.mjs', import.meta.url);
