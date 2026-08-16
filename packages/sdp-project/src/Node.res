type t = Type.Classify.object

type id = string

type label = string

@module("..")
external _create: (Position.t, PatchPath.t) => t = "createNode"

let create = patchPath => _create(Position.origin, patchPath)

@module("..") external getId: t => id = "getNodeId"

@module("..") external setId: (id, t) => t = "setNodeId"

@module("..") external getType: t => PatchPath.t = "getNodeType"

@module("..") external setType: (PatchPath.t, t) => t = "setNodeType"

@module("..") external getLabel: t => label = "getNodeLabel"

@module("..") external _setLabel: (label, t) => t = "setNodeLabel"

let setLabel = (node, label) => _setLabel(label, node)

@module("..") external getPosition: t => Position.t = "getNodePosition"

@module("..")
external _setPosition: (Position.t, t) => t = "setNodePosition"

let setPosition = (node, position) => _setPosition(position, node)

@module("..") external isPinNode: t => bool = "isPinNode"
