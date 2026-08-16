type t<'left, 'right> = Type.Classify.object

@module("../index.js")
external foldEither: ('left => 'a, 'right => 'a, t<'left, 'right>) => 'a = "foldEither"

@module("../index.js") external eitherLeft: 'left => t<'left, 'right> = "eitherLeft"

@module("../index.js") external eitherRight: 'right => t<'left, 'right> = "eitherRight"

let toResult = either =>
  either->foldEither(left => Belt.Result.Error(left), right => Belt.Result.Ok(right), _)

let fromResult = result =>
  switch result {
  | Belt.Result.Error(left) => eitherLeft(left)
  | Belt.Result.Ok(right) => eitherRight(right)
  }
