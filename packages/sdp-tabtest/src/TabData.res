// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

module Value = {
  type t =
    | Empty
    | NaN
    | Number(float)
    | ApproxNumber(float, int)
    | Boolean(bool)
    | String(string)
    | Byte(int)
    | Pulse(bool)
    | RaisedError
    | Invalid(string)
  let numberRegex = RegExp.fromString(`^[+-]?(?=.)*\\d*(?:\\.\\d+)?$`)
  let approxNumberRegex = RegExp.fromString(`^[+-]?(?=.)*\\d*(?:\\.\\d+)?~$`)
  let stringRegex = RegExp.fromString(`^".*"$`)
  let byteRegex = RegExp.fromString(`^[0-9a-f]{2}h|[0,1]{8}b|\\d{1,3}d$`, ~flags="i")
  let unquote = str =>
    str
    ->String.replaceRegExp(RegExp.fromString(`^"`), "")
    ->String.replaceRegExp(RegExp.fromString(`"$`), "")
  let init = (str: string): string => String.slice(str, ~start=0, ~end=String.length(str) - 1)
  let byteStringToInt = str =>
    switch str {
    | bin if RegExp.test(RegExp.fromString(`b$`), bin) =>
      init(bin)->Stdlib_Int.fromString(~radix=2)->Option.getExn->(x => Byte(x))
    | hex if RegExp.test(RegExp.fromString(`h$`), hex) =>
      init(hex)->Stdlib_Int.fromString(~radix=16)->Option.getExn->(x => Byte(x))
    | dec if RegExp.test(RegExp.fromString(`d$`), dec) =>
      init(dec)->Stdlib_Int.fromString->Option.getExn->(x => Byte(x))
    | x => Invalid(x)
    }
  let getPrecision = x => {
    let s = x->String.replaceRegExp(RegExp.fromString(`e\\+\\d+$`), "")
    let d = String.indexOf(s, ".") + 1
    d === 0 ? 0 : String.length(s) - d
  }
  let parse = str =>
    switch str {
    | "" => Empty
    | "true" => Boolean(true)
    | "false" => Boolean(false)
    | "pulse" => Pulse(true)
    | "no-pulse" => Pulse(false)
    | "error" => RaisedError
    | "NaN" => NaN
    | "Inf" => Number(infinity)
    | "+Inf" => Number(infinity)
    | "-Inf" => Number(neg_infinity)
    | numString if RegExp.test(numberRegex, numString) => Number(Stdlib_Float.parseFloat(numString))
    | approxNumString if RegExp.test(approxNumberRegex, approxNumString) =>
      let strWithoutTilde = approxNumString->String.replaceRegExp(RegExp.fromString(`~$`), "")
      let num = Stdlib_Float.parseFloat(strWithoutTilde)
      ApproxNumber(num, getPrecision(strWithoutTilde))
    | quotedString if RegExp.test(stringRegex, quotedString) => String(unquote(quotedString))
    | byteString if RegExp.test(byteRegex, byteString) => byteStringToInt(byteString)
    | x => Invalid(x)
    }
}

module Record = {
  type t = Map.String.t<Value.t>
  let fromPairs = (pairs: list<(string, Value.t)>): t => pairs->List.toArray->Map.String.fromArray
  let get = (t, column) =>
    Map.String.get(t, column)->Option.flatMap(value =>
      switch value {
      | Value.Empty => None
      | x => Some(x)
      }
    )
}

type t = list<Record.t>

let map = List.map

let mapWithIndex = List.mapWithIndex

let commentsRegEx = RegExp.fromString(`\\/\\/(.(?=([^"]*"[^"]*")*[^"]*$))+`, ~flags="gm")
/* Finds comments started with "//" and ignores it inside quotes */

let emptyLinesRegEx = RegExp.fromString(`^\\s+$`, ~flags="gm")

let tabSplit = x => String.split(x, "\t")->List.fromArray->List.map(String.trim)

let listDataLines = (tsvSource: string): list<string> =>
  tsvSource
  ->String.replaceRegExp(RegExp.fromString(`\\r`, ~flags="gm"), "")
  ->String.replaceRegExp(commentsRegEx, "")
  ->String.replaceRegExp(emptyLinesRegEx, "")
  ->String.split("\n")
  ->List.fromArray
  ->List.keep(x => x != "")

let parse = (tsvSource: string): t =>
  tsvSource
  ->listDataLines
  ->(
    lines =>
      switch List.head(lines) {
      | None => list{}
      | Some(firstLine) =>
        let header = tabSplit(firstLine)
        let lineToRecord = (line: string): Record.t =>
          tabSplit(line)->List.map(Value.parse)->List.zip(header, _)->Record.fromPairs
        List.tailExn(lines)->List.keep(x => x != "")->List.map(lineToRecord)
      }
  )
