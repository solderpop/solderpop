type t = Type.Classify.object

type id = string

type label = string

@module("../dist/index.js")
external _create: (Position.t, PatchPath.t) => t = "createNode"

let create = patchPath => _create(Position.origin, patchPath)

@module("../dist/index.js") external getId: t => id = "getNodeId"

@module("../dist/index.js") external setId: (id, t) => t = "setNodeId"

@module("../dist/index.js") external getType: t => PatchPath.t = "getNodeType"

@module("../dist/index.js") external setType: (PatchPath.t, t) => t = "setNodeType"

@module("../dist/index.js") external getLabel: t => label = "getNodeLabel"

@module("../dist/index.js") external _setLabel: (label, t) => t = "setNodeLabel"

let setLabel = (node, label) => _setLabel(label, node)

@module("../dist/index.js") external getPosition: t => Position.t = "getNodePosition"

@module("../dist/index.js")
external _setPosition: (Position.t, t) => t = "setNodePosition"

let setPosition = (node, position) => _setPosition(position, node)

@module("../dist/index.js") external isPinNode: t => bool = "isPinNode"
