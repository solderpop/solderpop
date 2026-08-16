type t = string

@module("..") external getBaseName: t => string = "getBaseName"

@module("..") external isTerminal: t => bool = "isTerminalPatchPath"

@module("..") external isJumper: t => bool = "isJumperPatchPath"

@module("..") external isBus: t => bool = "isBusPatchPath"
@module("..") external isFromBus: t => bool = "isFromBusPatchPath"
@module("..") external isToBus: t => bool = "isToBusPatchPath"
