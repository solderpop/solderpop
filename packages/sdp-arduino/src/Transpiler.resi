// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

open SdpProject

type program = {
  code: string,
  nodeIdMap: Map.String.t<string>,
}

@ocaml.doc("
 * Liveness describes how to transpile code:
 * - \"NONE\" — default for upload (stripping debug nodes)
 * - \"DEBUG\" — without stripping debug nodes and turns \"XOD_DEBUG\" on
 * - \"SIMULATION\" — without stripping debug nodes and turns \"XOD_SIMULATION\" on
 ")
type liveness =
  | None
  | Debug
  | Simulation

type xodGlobals = Map.String.t<string>

let transpile: (Project.t, PatchPath.t, liveness, xodGlobals) => XResult.t<program>
