type t = string

@module("../dist/index.js") external getBaseName: t => string = "getBaseName"

@module("../dist/index.js") external isTerminal: t => bool = "isTerminalPatchPath"

@module("../dist/index.js") external isJumper: t => bool = "isJumperPatchPath"

@module("../dist/index.js") external isBus: t => bool = "isBusPatchPath"
@module("../dist/index.js") external isFromBus: t => bool = "isFromBusPatchPath"
@module("../dist/index.js") external isToBus: t => bool = "isToBusPatchPath"
