# sdp-deploy

This package is a part of the [SolderPop IDE](https://github.com/solderpop/solderpop) project.

The package provides cloud compilation feature.

## Development

This package uses a web socket server to compile code and an http server to get upload config for boards. The URLs are fixed constants in `src/constants.js`, not currently overridable by environment variables:

* **DEFAULT_UPLOAD_CONFIG_URL** — URL that returns upload config for a board. Board identifier is appended at the end of the URL, so `https://compile.solderpop.io/upload/` is used like `https://compile.solderpop.io/upload/uno`

* **DEFAULT_CLOUD_COMPILE_URL** — URL for the web socket server, e.g. `wss://compile.solderpop.io/compile`
