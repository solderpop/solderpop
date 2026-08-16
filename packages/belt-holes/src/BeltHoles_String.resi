@ocaml.doc(" Functions for strings manipulation ")
type t = string

@ocaml.doc(" Joins multiple strings together placing a delimiter between each pair. ")
let join: (list<t>, t) => t

@ocaml.doc(" Joins multiple strings with <LF>. In other words, joins multiple lines into
    a single multiline string. ")
let joinLines: list<t> => t

@ocaml.doc(" Indents all lines in a multiline string with a specified number of
    spaces. ")
let indent: (t, int) => t

@ocaml.doc(" Writes the string backward ")
let reverse: t => t
