type t = Type.Classify.object

type id = string

@module("..")
external create: (~toPin: Pin.key, ~toNode: Node.id, ~fromPin: Pin.key, ~fromNode: Node.id) => t =
  "createLink"

@module("..") external getId: t => id = "getLinkId"

@module("..")
external getInputNodeId: t => Node.id = "getLinkInputNodeId"

@module("..")
external getOutputNodeId: t => Node.id = "getLinkOutputNodeId"

@module("..")
external getInputPinKey: t => Pin.key = "getLinkInputPinKey"

@module("..")
external getOutputPinKey: t => Pin.key = "getLinkOutputPinKey"

@module("..")
external setInputPinKey: (Pin.key, t) => t = "setLinkInputPinKey"

@module("..")
external setOutputPinKey: (Pin.key, t) => t = "setLinkOutputPinKey"

@module("..")
external inputNodeIdEquals: (Node.id, t) => bool = "isLinkInputNodeIdEquals"

@module("..")
external outputNodeIdEquals: (Node.id, t) => bool = "isLinkOutputNodeIdEquals"

@module("..")
external inputPinKeyEquals: (Pin.key, t) => bool = "isLinkInputPinKeyEquals"

@module("..")
external outputPinKeyEquals: (Pin.key, t) => bool = "isLinkOutputPinKeyEquals"
