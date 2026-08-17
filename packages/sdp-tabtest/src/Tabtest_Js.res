// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

let generatePatchSuite = (project, patchPath) =>
  Tabtest.generatePatchSuite(project, patchPath)
  ->BeltHoles.Result.map(files => files->Map.String.toList->List.toArray->Dict.fromArray)
  ->Either.fromResult

let generateProjectSuite = project =>
  Tabtest.generateProjectSuite(project)
  ->BeltHoles.Result.map(files => files->Map.String.toList->List.toArray->Dict.fromArray)
  ->Either.fromResult
