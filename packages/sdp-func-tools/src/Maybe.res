type t<'a> = Type.Classify.object

@module("../dist/index.js") external foldMaybe: ('b, 'a => 'b, t<'a>) => 'b = "foldMaybe"

let toOption = maybe => maybe->foldMaybe(None, justValue => Some(justValue), _)
