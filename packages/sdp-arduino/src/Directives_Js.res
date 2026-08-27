// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

let isDirtienessEnabled = Directives.isDirtienessEnabled

let doesCatchErrors = Directives.doesCatchErrors

let isNodeIdEnabled = Directives.isNodeIdEnabled

let doesRaiseErrors = Directives.doesRaiseErrors

let getEvaluateOnPinSettings = code => {
  let {enabled, exceptions} = code->Directives.getEvaluateOnPinSettings
  {
    "enabled": enabled,
    "exceptions": Set.String.toArray(exceptions),
  }
}

let areTimeoutsEnabled = Directives.areTimeoutsEnabled

let isSetImmediateEnabled = Directives.isSetImmediateEnabled

let stripCppComments = Directives.stripCppComments

let findXodPragmas = code => code->Directives.findXodPragmas->List.toArray->Array.map(List.toArray)

let findRequireUrls = code => code->Directives.findRequireUrls->List.toArray
