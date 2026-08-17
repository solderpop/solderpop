type t<'a> = Type.Classify.object

@module("..") external foldMaybe: ('b, 'a => 'b, t<'a>) => 'b = "foldMaybe"

let toOption = maybe => maybe->foldMaybe(None, justValue => Some(justValue), _)
