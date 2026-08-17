// Warning 44 (open-statement shadows an identifier) fires because `open
// Belt` shadows ReScript's own built-in `Map` module -- intentional here,
// this file is specifically extending Belt.Map.String.
@@warning("-44")
open Belt

type k = Map.String.key

type t<'v> = Map.String.t<'v>

let mapKeys = (xs, fn) =>
  Map.String.toArray(xs)->Array.map(((k, v)) => (fn(k), v))->Map.String.fromArray

let keepMapWithKey = (xs: t<'v>, fn: (k, 'v) => option<'v2>): t<'v2> =>
  Map.String.toArray(xs)
  ->Array.keepMap(((k, v)) => fn(k, v)->Option.map(v2 => (k, v2)))
  ->Map.String.fromArray

let keepMap = (xs: t<'v>, fn: 'v => option<'v2>): t<'v2> => keepMapWithKey(xs, (_, v) => fn(v))

let innerJoin = (xs, ys) => keepMap(xs, v => ys->Map.String.get(v))

let mergeOverride = (xs, ys) =>
  Map.String.merge(xs, ys, (_key, ox, oy) =>
    switch oy {
    | Some(y) => Some(y)
    | None => ox
    }
  )

let fromDict = d => d->Dict.toArray->Map.String.fromArray

let toDict = m => m->Map.String.toArray->Dict.fromArray
