# sdp-client-electron

This package is a part of the [SolderPop IDE](https://github.com/solderpop/solderpop) project.

The package is a thin wrapper around [`sdp-client`](https://github.com/solderpop/solderpop/tree/main/packages/sdp-client) which lifts it to a ready-to-use IDE.

It is based on [Electron](https://electron.atom.io/).

## Package gotchas

### Always rebuild native dependencies from source

For `electron-builder` we have to provide option:

```
"buildDependenciesFromSource": true
```

to properly build `serialport` native package when creating distributives. Otherwise it would be compiled against wrong version of Node ABI. Following issues have to be solved before we could drop the option:

* https://github.com/EmergingTechnologyAdvisors/node-serialport/issues/1180
* https://github.com/EmergingTechnologyAdvisors/node-serialport/issues/1263

### Dedicate dist directory to electron-builder

All other packages use `dist/` as a target of transpilation, `sdp-client-electron` is not because `dist` name used to be reserved for distro packaging. It uses `src-babel/` as a target for transpilation.

It have to be fixed since now `electron-builder` supports `directories/output` option.
