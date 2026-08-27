// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

module ResultsMap: {
  @ocaml.doc(" Type deduction result for a single pin.
    Either a single type or an array of conflicting types ")
  type result = Result.t<Pin.dataType, array<Pin.dataType>>
  @ocaml.doc(" The \"outer\" map has Node.id as keys,
      the \"inner\" map — Pin.key ")
  type t = Map.String.t<Map.String.t<result>>
  @ocaml.doc(" Js representation of deduction results ")
  type t_Js = dict<dict<SdpFuncTools.Either.t<array<Pin.dataType>, Pin.dataType>>>
  @ocaml.doc(" convert from Js representation ")
  let fromJsDict: t_Js => t
  @ocaml.doc(" convert to Js representation ")
  let toJsDict: t => t_Js
  @ocaml.doc(" get a deduction result for a specified node's pin ")
  let get: (t, Node.id, Pin.key) => option<result>
  @ocaml.doc(" set a deduction result for a specified node's pin ")
  let assoc: (t, Node.id, Pin.key, result) => t
  @ocaml.doc(" remove a deduction result for a specified node's pin ")
  let dissoc: (t, Node.id, Pin.key) => t
}

@ocaml.doc(" Deduce types for generic pins in a given patch ")
let deducePinTypes: (Patch.t, Project.t) => ResultsMap.t
