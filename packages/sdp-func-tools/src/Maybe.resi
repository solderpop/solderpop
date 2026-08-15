@ocaml.doc(" A type represented by Maybe from ramda-fantasy in JS. Used only for
    interoping between Reason and JS. ")
type t<'a> = Type.Classify.object

let toOption: t<'a> => option<'a>
