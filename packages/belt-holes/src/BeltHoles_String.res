// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's List/Array, not ReScript's built-in ones.
@@warning("-44")
open Belt

type t = string

let join = (xs, delimiter) => {
  let reduce = (xs, delimiter) =>
    List.reduce(xs, ("", ""), ((acc, delimiter'), s) => (acc ++ (delimiter' ++ s), delimiter))
  let (str, _) = reduce(xs, delimiter)
  str
}

let joinLines = join(_, "\n")

let indent = (str, n) => Js.String.replaceByRe(/^/gm, Js.String.repeat(n, " "), str)

let reverse = str => Js.String.split("", str)->Array.reverse->List.fromArray->join("")
