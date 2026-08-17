type t = Type.Classify.object

type id = string

@module("../dist/index.js")
external create: (~toPin: Pin.key, ~toNode: Node.id, ~fromPin: Pin.key, ~fromNode: Node.id) => t =
  "createLink"

@module("../dist/index.js") external getId: t => id = "getLinkId"

@module("../dist/index.js")
external getInputNodeId: t => Node.id = "getLinkInputNodeId"

@module("../dist/index.js")
external getOutputNodeId: t => Node.id = "getLinkOutputNodeId"

@module("../dist/index.js")
external getInputPinKey: t => Pin.key = "getLinkInputPinKey"

@module("../dist/index.js")
external getOutputPinKey: t => Pin.key = "getLinkOutputPinKey"

@module("../dist/index.js")
external setInputPinKey: (Pin.key, t) => t = "setLinkInputPinKey"

@module("../dist/index.js")
external setOutputPinKey: (Pin.key, t) => t = "setLinkOutputPinKey"

@module("../dist/index.js")
external inputNodeIdEquals: (Node.id, t) => bool = "isLinkInputNodeIdEquals"

@module("../dist/index.js")
external outputNodeIdEquals: (Node.id, t) => bool = "isLinkOutputNodeIdEquals"

@module("../dist/index.js")
external inputPinKeyEquals: (Pin.key, t) => bool = "isLinkInputPinKeyEquals"

@module("../dist/index.js")
external outputPinKeyEquals: (Pin.key, t) => bool = "isLinkOutputPinKeyEquals"
