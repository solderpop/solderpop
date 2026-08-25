# sdp-cli

This package is a part of the [SolderPop IDE](https://github.com/solderpop/solderpop) project.

The package contains implemetation of `sdpc` command line utility.

Basically it’s a collection of thin wrappers around NodeJS API’s available via other packages. The responsibility of `sdp-cli` is to parse command line arguments, call API, and format the result on stdout/stderr properly.

`sdpc` uses subcommands like `git` does to perform various functions. The subcommands handling could be found in `src/commands/*.js`.

<!-- toc -->
* [sdp-cli](#sdp-cli)
* [Flags, aliases, environment variables](#flags-aliases-environment-variables)
* [Commands](#commands)
<!-- tocstop -->

# Flags, aliases, environment variables

Almost any flag can be replaced with the appropriate environment variable. For example, instead of `--username` you can declare variable `XOD_USERNAME`.

| Flag         | Alias | Environment variable |
| ------------ | ----- | -------------------- |
| --api        |       | XOD_API              |
| --board      | -b    | XOD_BOARD            |
| --debug      |       | XOD_DEBUG            |
| --on-behalf  |       | XOD_ONBEHALF         |
| --output     | -o    | XOD_OUTPUT           |
| --output-dir | -o    | XOD_OUTPUT           |
| --password   |       | XOD_PASSWORD         |
| --port       | -p    | XOD_PORT             |
| --username   |       | XOD_USERNAME         |
| --workspace  | -w    | XOD_WORKSPACE        |

# Commands

<!-- commands -->
* [`sdpc autocomplete [SHELL]`](#sdpc-autocomplete-shell)
* [`sdpc boards [options]`](#sdpc-boards-options)
* [`sdpc compile [options] [entrypoint]`](#sdpc-compile-options-entrypoint)
* [`sdpc help [COMMAND]`](#sdpc-help-command)
* [`sdpc install:arch [fqbn]`](#sdpc-installarch-fqbn)
* [`sdpc publish [options] [project]`](#sdpc-publish-options-project)
* [`sdpc resave [options] [project]`](#sdpc-resave-options-project)
* [`sdpc tabtest [options] [entrypoint]`](#sdpc-tabtest-options-entrypoint)
* [`sdpc transpile [options] [entrypoint]`](#sdpc-transpile-options-entrypoint)
* [`sdpc upload [options] [entrypoint]`](#sdpc-upload-options-entrypoint)

## `sdpc autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ sdpc autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ sdpc autocomplete
  $ sdpc autocomplete bash
  $ sdpc autocomplete zsh
  $ sdpc autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.0/src/commands/autocomplete/index.ts)_

## `sdpc boards [options]`

show available boards

```
USAGE
  $ sdpc boards [options]

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
```

_See code: [src/commands/boards.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/boards.js)_

## `sdpc compile [options] [entrypoint]`

compiles (verifies) a XOD program

```
USAGE
  $ sdpc compile [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -b, --board=fqbn      (required) target board identifier (see `sdpc boards` output)
  -h, --help            show CLI help

  -o, --output=path     save the result binary to the directory; the same directory is used for intermediate build
                        artifacts; defaults to `cwd`

  -q, --quiet           do not log messages other than errors

  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod

  --debug               enable debug traces

EXAMPLES
  Compile a program using the current patch as entry point
  $ sdpc compile -b arduino:avr:uno

  Compile the patch `main` from the xodball project and save binaries in `bin/uno.hex`
  $ sdpc compile -b arduino:arv:uno foo.xodball main -o bin/uno.hex
```

_See code: [src/commands/compile.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/compile.js)_

## `sdpc help [COMMAND]`

display help for sdpc

```
USAGE
  $ sdpc help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_

## `sdpc install:arch [fqbn]`

install toolchains

```
USAGE
  $ sdpc install:arch [fqbn]

ARGUMENTS
  FQBN  Board FQBN. `arduino:sam` for example. See `sdpc boards` list for the full list.

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
```

_See code: [src/commands/install/arch.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/install/arch.js)_

## `sdpc publish [options] [project]`

publish a library

```
USAGE
  $ sdpc publish [options] [project]

ARGUMENTS
  PROJECT
      Project to operate on. The project should point to a file or directory
      on file system. If omitted, it is inferred from the current working
      directory. Examples:

         * ./path/to/proj.xodball           # xodball
         * ./path/to/proj                   # just full path to a project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --api=hostname        [default: solderpop.io] XOD API hostname
  --on-behalf=username  publish on behalf of the username
  --password=password   XOD API password
  --username=username   XOD API username

EXAMPLES
  Publish the current project with the version defined in `project.xod`
  $ sdpc publish

  Publish a project saved as xodball
  $ sdpc publish foo.xodball
```

_See code: [src/commands/publish.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/publish.js)_

## `sdpc resave [options] [project]`

opens a project and saves it in another location or format

```
USAGE
  $ sdpc resave [options] [project]

ARGUMENTS
  PROJECT
      Project to operate on. The project should point to a file or directory
      on file system. If omitted, it is inferred from the current working
      directory. Examples:

         * ./path/to/proj.xodball           # xodball
         * ./path/to/proj                   # just full path to a project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -o, --output=path     xodball or multifile directory output path, defaults to stdout
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod

EXAMPLES
  Exports the current multifile project to a xodball
  $ sdpc resave . -o ~/foo.xodball

  Outputs the current multifile project as a xodball to stdout
  $ sdpc resave

  Resaves one xodball into another (useful for applying migrations)
  $ sdpc resave foo.xodball -o bar.xodball

  Converts a xodball to a multifile project
  $ sdpc resave foo.xodball -o /some/new/dir
```

_See code: [src/commands/resave.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/resave.js)_

## `sdpc tabtest [options] [entrypoint]`

tabtest project

```
USAGE
  $ sdpc tabtest [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version          show CLI version
  -h, --help             show CLI help
  -o, --output-dir=path  [default: /tmp/sdp-tabtest] path to directory where to save tabtest data
  -q, --quiet            do not log messages other than errors
  -w, --workspace=path   [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --no-build             do not build

EXAMPLES
  Build tabtests for project in current working directory
  $ sdpc tabtest

  Specify target directory and project, only generate tests
  $ sdpc tabtest --no-build --output-dir=/tmp/sdp-tabtest ./workspace/__lib__/xod/net
```

_See code: [src/commands/tabtest.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/tabtest.js)_

## `sdpc transpile [options] [entrypoint]`

transpiles (generates C++) a XOD program

```
USAGE
  $ sdpc transpile [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -o, --output=path     C++ output file path, default to stdout
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --debug               enable debug traces

EXAMPLES
  Transpile a program using the cwd patch as entry point, print to stdout
  $ sdpc transpile

  Transpile the current project with `main` patch as entry point, save the output in `x.cpp`
  $ sdpc transpile main -o x.cpp

  Transpile a project in the xodball with `main` patch as entry point
  $ sdpc transpile foo.xodball main
```

_See code: [src/commands/transpile.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/transpile.js)_

## `sdpc upload [options] [entrypoint]`

uploads a XOD program to the board

```
USAGE
  $ sdpc upload [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -b, --board=fqbn      (required) target board identifier (see `sdpc boards` output)
  -h, --help            show CLI help
  -p, --port=port       (required) port to use for upload
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --debug               enable debug traces

EXAMPLE
  Compile a program using the current patch as entry point, upload to ttyACM1
  $ sdpc upload -b arduino:avr:uno -p /dev/ttyACM1
```

_See code: [src/commands/upload.js](https://github.com/solderpop/solderpop/blob/main/packages/sdp-cli/src/commands/upload.js)_
<!-- commandsstop -->
