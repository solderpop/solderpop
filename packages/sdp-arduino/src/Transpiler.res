// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

open SdpProject

module TProject = {
  type t
}

type program = {
  code: string,
  nodeIdMap: Map.String.t<string>,
}

type liveness =
  | None
  | Debug
  | Simulation

type xodGlobals = Map.String.t<string>

@module("../dist/index.js")
external _transformProject: (
  Project.t,
  string,
  string,
  xodGlobals,
) => Either.t<JsExn.t, TProject.t> = "transformProject"

@module("../dist/index.js") external _transpile: TProject.t => string = "transpile"

@module("../dist/index.js")
external _getNodeIdsMap: TProject.t => dict<string> = "getNodeIdsMap"

let getLivenessString = liveness =>
  switch liveness {
  | None => "NONE"
  | Debug => "DEBUG"
  | Simulation => "SIMULATION"
  }

let transpile = (project, patchPath, liveness, xodGlobals): XResult.t<program> =>
  _transformProject(project, patchPath, getLivenessString(liveness), xodGlobals)
  ->Either.toResult
  ->BeltHoles.Result.map(tProject => {
    code: _transpile(tProject),
    nodeIdMap: _getNodeIdsMap(tProject)->Dict.toArray->Map.String.fromArray,
  })
