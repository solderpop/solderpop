# sdp-fs

This package is a part of the [SolderPop IDE](https://github.com/solderpop/solderpop) project.

The package provides API to work with workspaces, libraries and projects that are stored as different files on the file system. It lets converting between normal (split files), xodball (single project monolith), and RAM representation.

Since it requires access to file system `sdp-fs` is used by `sdp-cli` and `sdp-client-electron` packages. It is not used by `sdp-client-browser` because a browser has no full access to user’s file system.
