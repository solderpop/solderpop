// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's List/Map, not ReScript's built-in ones.
@@warning("-44")
open Belt

let groupByString = (values, getKey) =>
  List.reduceReverse(values, Map.String.empty, (accMap, nextVal) =>
    Map.String.update(accMap, getKey(nextVal), existingVals =>
      switch existingVals {
      | Some(vs) => Some(list{nextVal, ...vs})
      | None => Some(list{nextVal})
      }
    )
  )

let groupBy = (values, id, getKey) =>
  List.reduceReverse(values, Map.make(~id), (accMap, nextVal) =>
    Map.update(accMap, getKey(nextVal), existingVals =>
      switch existingVals {
      | Some(vs) => Some(list{nextVal, ...vs})
      | None => Some(list{nextVal})
      }
    )
  )
