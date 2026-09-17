<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/solderpop-lockup-dark.svg">
  <img alt="SolderPop" src="./.github/assets/solderpop-lockup.svg" width="260">
</picture>

Welcome — SolderPop IDE is a visual programming environment for [ClickClack](https://github.com/solderpop), SolderPop's microcontroller hardware line. Wire up logic on a canvas, flash it to a board, iterate.

Under the hood, SolderPop IDE builds on the visual-programming engine of [XOD](https://xod.io) ([xodio/xod](https://github.com/xodio/xod)), used here under its original AGPL-3.0 license — see [License](#license) below.

![Xoding demo](./.github/xoding.gif)

## Installation & Quick start

Currently source-only — build from source below to get a desktop or browser-based IDE. There is no hosted build yet.

## Building from source

SolderPop IDE is written in JavaScript and ReScript. You need Node.js and [pnpm](https://pnpm.io) to build from source. Make sure they are available on your system.

Clone the repository and set working directory to its root. Then run:

```bash
# Install all JavaScript and ReScript dependencies
pnpm install

# Build all packages
pnpm build
```

To start the desktop IDE run:

```bash
pnpm run start:electron
```

Alternatively, run browser-based IDE:

```bash
pnpm run dev:browser
# IDE is available at <http://localhost:8080>
```

## Directory structure

The project is managed as a [pnpm](https://pnpm.io) + [Turborepo](https://turborepo.com) monorepo and split up in few directories:

* `packages/` — most of source code is here; navigate to a particular package to see it’s own `README` and get an idea what it is for
* `tools/` — utility scripts to assist build process and routine maintenance tasks
* `workspace/` — XOD standard library, default projects, and end-to-end fixtures

## Repository commands

You can run several commands on source files. They are available as pnpm subcommands:

* `pnpm build` — build, transpile, pack all
* `pnpm run build:electron` — build desktop IDE only
* `pnpm run build:cli` — build CLI tools only
* `pnpm run dev:browser` — run dev-version of browser IDE on localhost
* `pnpm run dist:electron` — build OS-specific distributive of desktop IDE
* `pnpm test` — run unit tests
* `pnpm run test-cpp` — run C++ code tests
* `pnpm run test-func` — run functional tests
* `pnpm run tabtest` — run standard library tabular tests
* `pnpm lint` — run the linter to check code style
* `pnpm run verify` — build, lint, test; run this prior to a pull request
* `pnpm run start:electron` — starts desktop IDE
* `pnpm run start:spectron-repl` — starts functional tests environment
* `pnpm run storybook` — starts React components viewer for visual inspection
* `pnpm run clean` — remove build artifacts and installed `node_modules`

`test`, `start:*`, and similar tasks depend on `build` in Turborepo's task graph, so the project gets (re)built automatically as needed — you don't have to build first by hand.

### Scoping

Turborepo's `--filter` flag scopes commands to one package (and optionally its dependencies), same idea as Lerna's old `--scope`. To rebuild only `sdp-project`:

```bash
pnpm exec turbo run build --filter=sdp-project
```

To rebuild `sdp-project` and everything that depends on it:

```bash
pnpm exec turbo run build --filter=sdp-project...
```

See [Turborepo's filter docs](https://turborepo.com/docs/reference/run#--filter-string) for the full syntax.

### Debugging functional tests

`pnpm run test-func` runs automated end-to-end functional tests.

You can set `XOD_DEBUG_TESTS` environment variable to keep IDE open on failure: `XOD_DEBUG_TESTS=1 pnpm run test-func`

Use `pnpm run start:spectron-repl` to run an interactive session and control the IDE window programmatically.

### Running C++ and tabular tests

You need `gcc` and `avr-gcc` to be installed system-wide to run C++ code tests. They are available as OS packages for most platforms.

## License

Copyright © 2017–2019 XOD Inc.

Copyright © 2026 SolderPop

SolderPop IDE is a modified, rebranded fork of [xodio/xod](https://github.com/xodio/xod) (base version 0.38.x), retargeted at SolderPop's ClickClack hardware. See individual file headers for per-file modification notices.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

As a special exception, the copyright holders give permission to link the code of portions of this program with the OpenSSL library under certain conditions as described in each individual source file and distribute linked combinations including the program with the OpenSSL library. You must comply with the GNU Affero General Public License in all respects for all of the code used other than as permitted herein. If you modify file(s) with this exception, you may extend this exception to your version of the file(s), but you are not obligated to do so. If you do not wish to do so, delete this exception statement from your version. If you delete this exception statement from all source files in the program, then also delete it in the license file.

## Contributing

Feel free to contribute to the project! See the general [Contibutor’s guide](https://xod.io/docs/contributing/) and [GitHub contribution guidelines](./CONTRIBUTING.md).
