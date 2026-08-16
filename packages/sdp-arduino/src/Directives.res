// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

type code = string

module Endis = {
  type t =
    | Enable
    | Disable
    | Auto
  let toBoolean = (hint, default) =>
    switch hint {
    | Enable => true
    | Disable => false
    | Auto => default
    }
  let fromString = tok =>
    switch tok {
    | "enable" => Enable
    | "disable" => Disable
    | _ => Auto
    }
}

module Pragma = {
  type t = list<string>
  let filterPragmasByFeature = (pragmas: list<t>, feature) =>
    pragmas->List.keep(pragma =>
      switch pragma {
      | list{} => false
      | list{feat, ..._} => feat == feature
      }
    )
}

module Re = {
  let replace = (~flags="gm", str, regex, sub) =>
    Js.String.replaceByRe(RegExp.fromString(regex, ~flags), sub, str)
  let remove = (~flags="gm", str, regex) => replace(~flags, str, regex, "")
  let test = (~flags="gm", str, regex) => RegExp.test(RegExp.fromString(regex, ~flags), str)
  let matches = (~flags="gm", str, regex) => {
    let reObj = RegExp.fromString(regex, ~flags)
    /* Extracts the current match, ignoring capturing groups.
     Assumption: 0-th always exists and refers to the full match */
    let fullMatch = execResult => execResult->RegExp.Result.fullMatch
    let rec captureNext = (): list<string> =>
      switch RegExp.exec(reObj, str) {
      | None => list{}
      | Some(result) => List.add(captureNext(), fullMatch(result))
      }
    captureNext()
  }
}

module Code = {
  /*
    Regexp from here: https://regex101.com/r/qY4xD3/15
    Found a link here: https://stackoverflow.com/questions/36454069/how-to-remove-c-style-comments-from-code
    Edited: removed one `\n` in the second non-capturing group to avoid removing new lines
 */
  let allCommentsRegexp = `(?:\\/\\/(?:\\\\\\n|[^\\n])*)|(?:\\/\\*[\\s\\S]*?\\*\\/)|((?:"([^(\\\\\\s])\\([^)]*\\)\\2")|(?:@"[^"]*?")|(?:"(?:\\?\\?'|\\\\\\\\|\\\\"|\\\\\\n|[^"])*?")|(?:'(?:\\\\\\\\|\\\\'|\\\\\\n|[^'])*?'))`
  let trimRegexp = `\\s*$`
  let stripCppComments = code => code->Re.replace(allCommentsRegexp, "$1")->Re.remove(trimRegexp)
  let doesReferSymbol = (symbol, code) =>
    code->stripCppComments->Re.test("\\b" ++ (symbol ++ "\\b"))
  let doesReferTemplateSymbol = (symbol, templateArg, code) =>
    code
    ->stripCppComments
    ->Re.test("\\b" ++ (symbol ++ ("\\s*\\<\\s*" ++ (templateArg ++ "\\s*\\>"))))
  let pragmaHeadRegexp = `#\\s*pragma\\s+XOD\\s+`
  let pragmaLineRegexp = pragmaHeadRegexp ++ ".*"
  let identifierOrStringRegexp = `[\\w._-]+|".*?"`
  let enclosingQuotesRegexp = `^"|"$`
  let isOutput = identifier => Re.test(identifier, `^output_`)
  let tokenizePragma = (pragmaLine: string): Pragma.t =>
    pragmaLine
    ->Re.remove(pragmaHeadRegexp)
    ->Re.matches(identifierOrStringRegexp)
    ->List.map(token => Re.remove(token, enclosingQuotesRegexp))
  let findXodPragmas = (code): list<Pragma.t> =>
    code->stripCppComments->Re.matches(pragmaLineRegexp)->List.map(tokenizePragma)
  /*
      Returns whether a particular #pragma feature enabled, disabled, or set to auto.
      Default is auto
 */
  let lastPragmaEndis = (code, feature): Endis.t =>
    code
    ->findXodPragmas
    ->Pragma.filterPragmasByFeature(feature)
    ->List.reverse
    ->List.head
    ->(
      lastPragma =>
        switch lastPragma {
        | Some(list{_, x, ..._}) => Endis.fromString(x)
        | _ => Endis.Auto
        }
    )
}

let areTimeoutsEnabled = code =>
  code->Code.lastPragmaEndis("timeouts")->Endis.toBoolean(Code.doesReferSymbol("setTimeout", code))

let isSetImmediateEnabled = code =>
  code
  ->Code.lastPragmaEndis("immediate")
  ->Endis.toBoolean(Code.doesReferSymbol("setImmediate", code))

let isNodeIdEnabled = code =>
  code->Code.lastPragmaEndis("nodeid")->Endis.toBoolean(Code.doesReferSymbol("getNodeId", code))

let doesRaiseErrors = code =>
  code
  ->Code.lastPragmaEndis("error_raise")
  ->Endis.toBoolean(Code.doesReferSymbol("raiseError", code))

let isDirtienessEnabled = (code, identifier) =>
  code
  ->Code.findXodPragmas
  ->List.reduce(
    Code.isOutput(identifier) /* dirtieness enabled on outputs by default */ ||
    Code.doesReferTemplateSymbol("isInputDirty", identifier, code),
    (acc, pragma) =>
      switch pragma {
      | list{"dirtieness", hintTok} => Endis.toBoolean(Endis.fromString(hintTok), acc)
      | list{"dirtieness", hintTok, ident} if ident == identifier =>
        Endis.toBoolean(Endis.fromString(hintTok), acc)
      | _ => acc
      },
  )

type evaluateOnPinSettings = {
  enabled: bool,
  exceptions: Set.String.t,
}

let mergeList = (s: Set.String.t, arr: list<string>): Set.String.t =>
  s->Set.String.mergeMany(List.toArray(arr))

let removeList = (s: Set.String.t, arr: list<string>): Set.String.t =>
  s->Set.String.removeMany(List.toArray(arr))

let getEvaluateOnPinSettings = code =>
  code
  ->Code.findXodPragmas
  ->Pragma.filterPragmasByFeature("evaluate_on_pin")
  ->List.reduce(
    {
      enabled: true,
      exceptions: Set.String.empty,
    },
    (acc, pragma) =>
      switch pragma {
      | list{_, "enable"} => {
          enabled: true,
          exceptions: Set.String.empty,
        }
      | list{_, "disable"} => {
          enabled: false,
          exceptions: Set.String.empty,
        }
      | list{_, "enable", ...enabledPins} => {
          ...acc,
          exceptions: acc.enabled
            ? removeList(acc.exceptions, enabledPins)
            : mergeList(acc.exceptions, enabledPins),
        }
      | list{_, "disable", ...disabledPins} => {
          ...acc,
          exceptions: acc.enabled
            ? mergeList(acc.exceptions, disabledPins)
            : removeList(acc.exceptions, disabledPins),
        }
      | _ => acc
      },
  )

let doesCatchErrors = code =>
  code->Code.lastPragmaEndis("error_catch")->Endis.toBoolean(Code.doesReferSymbol("getError", code))

let findXodPragmas = Code.findXodPragmas

let urlRegexp = `^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$`

let findRequireUrls = code =>
  code
  ->Code.findXodPragmas
  ->List.reduce(list{}, (acc, v) =>
    switch v {
    | list{"require", url} => Re.test(url, urlRegexp) ? list{url, ...acc} : acc
    | _ => acc
    }
  )

let stripCppComments = Code.stripCppComments
