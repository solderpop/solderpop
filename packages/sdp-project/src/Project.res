// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

type t = Type.Classify.object

@module("../dist/index.js") external _listPatches: t => array<Patch.t> = "listPatches"

let listPatches = project => _listPatches(project)->List.fromArray

@module("../dist/index.js")
external _listLocalPatches: t => array<Patch.t> = "listLocalPatches"

let listLocalPatches = project => _listLocalPatches(project)->List.fromArray

@module("../dist/index.js")
external _assocPatch: (PatchPath.t, Patch.t, t) => t = "assocPatch"

let assocPatch = (project, path, patch) => _assocPatch(path, patch, project)

@module("../dist/index.js")
external _getPatchByPath: (PatchPath.t, t) => Maybe.t<Patch.t> = "getPatchByPath"

let getPatchByPath = (project, path) => _getPatchByPath(path, project)->Maybe.toOption

let getPatchByNode = (project, node) => getPatchByPath(project, Node.getType(node))

@module("../dist/index.js")
external _getPatchDependencies: (Patch.path, t) => array<Patch.path> = "getPatchDependencies"

let getPatchDependencies = (project, patchPath) =>
  _getPatchDependencies(patchPath, project)->Belt.List.fromArray

@module("../dist/index.js")
external _upsertPatches: (array<Patch.t>, t) => t = "upsertPatches"

let upsertPatches = (project, patchList) => _upsertPatches(Belt.List.toArray(patchList), project)
