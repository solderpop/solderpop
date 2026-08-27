// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's List/Map, not ReScript's built-in ones.
@@warning("-44")
open Belt

@ocaml.doc(" Splits a list into sub-lists stored in a Map.String,
    based on the result of calling a string-returning function on each element,
    and grouping the results according to values returned. ")
let groupByString: (list<'a>, 'a => string) => Map.String.t<list<'a>>

@ocaml.doc(" Splits a list into sub-lists stored in a Map,
    based on the result of calling a key-returning function on each element,
    and grouping the results according to values returned. ")
let groupBy: (list<'v>, Map.id<'k, 'c>, 'v => 'k) => Map.t<'k, list<'v>, 'c>
