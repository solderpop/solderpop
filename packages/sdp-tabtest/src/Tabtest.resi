// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

open SdpProject

@ocaml.doc(" 'Filename -> Content' map of all C++ files comprising the test suite.
     The catch.hpp and Arduino.* stubs are omitted here and should be
     additionally added by a consumer or made available with a -Include path
     g++ switch. ")
type t = Map.String.t<string>

@ocaml.doc(" Returns a test suite for the given patch of a project ")
let generatePatchSuite: (Project.t, Patch.path) => XResult.t<t>

@ocaml.doc(" Returns a test suite for all patches with tabtests in the given project ")
let generateProjectSuite: Project.t => XResult.t<t>
