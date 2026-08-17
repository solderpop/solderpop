// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's collections, not ReScript's built-in ones.
@@warning("-44")
open Belt

open SdpFuncTools

type t = Type.Classify.object

type path = PatchPath.t

@module("../dist/index.js") external create: unit => t = "createPatch"

@module("../dist/index.js") external getPath: t => path = "getPatchPath"

@module("../dist/index.js") external _assocNode: (Node.t, t) => t = "assocNode"

let assocNode = (patch, node) => _assocNode(node, patch)

@module("../dist/index.js") external _dissocNode: (Node.id, t) => t = "dissocNode"

let dissocNode = (patch, nodeId) => _dissocNode(nodeId, patch)

@module("../dist/index.js") external _listNodes: t => array<Node.t> = "listNodes"

@module("../dist/index.js")
external _getNodeById: (Node.id, t) => SdpFuncTools.Maybe.t<Node.t> = "getNodeById"

let getNodeById = (patch, nodeId) => _getNodeById(nodeId, patch)->Maybe.toOption

@module("../dist/index.js")
external _upsertNodes: (array<Node.t>, t) => t = "upsertNodes"

let upsertNodes = (patch, nodes) => _upsertNodes(List.toArray(nodes), patch)

let listNodes = patch => _listNodes(patch)->List.fromArray

@module("../dist/index.js") external _assocLink: (Link.t, t) => t = "assocLink"

let assocLink = (patch, link) => _assocLink(link, patch)

@module("../dist/index.js")
external _upsertLinks: (array<Link.t>, t) => t = "upsertLinks"

let upsertLinks = (patch, links) => _upsertLinks(List.toArray(links), patch)

@module("../dist/index.js") external _listLinks: t => array<Link.t> = "listLinks"

let listLinks = patch => _listLinks(patch)->List.fromArray

@module("../dist/index.js") external _listPins: t => array<Pin.t> = "listPins"

let listPins = patch => _listPins(patch)->List.fromArray

@module("../dist/index.js") external _omitLinks: (array<Link.t>, t) => t = "omitLinks"

let omitLinks = (patch, links) => _omitLinks(List.toArray(links), patch)

@module("../dist/index.js")
external _getPinByKey: (Pin.key, t) => Maybe.t<Pin.t> = "getPinByKey"

let getPinByKey = (patch, pinKey) => _getPinByKey(pinKey, patch)->Maybe.toOption

@module("../dist/index.js")
external _getVariadicPinByKey: (Node.t, Pin.key, t) => Maybe.t<Pin.t> = "getVariadicPinByKey"

let getVariadicPinByKey = (patch, node, pinKey) =>
  _getVariadicPinByKey(node, pinKey, patch)->Maybe.toOption

let listInputPins = patch => patch->listPins->List.keep(pin => Pin.getDirection(pin) == Pin.Input)

let listOutputPins = patch => patch->listPins->List.keep(pin => Pin.getDirection(pin) == Pin.Output)

/* TODO: is it defined anywhere already? */
let identity = a => a

let findPinByLabel = (patch, label, ~normalize, ~direction): option<Pin.t> =>
  listPins(patch)
  ->(normalize ? Pin.normalizeLabels : identity)
  ->List.keep(pin => Pin.getLabel(pin) == label)
  ->(pins =>
    switch direction {
    | None => pins
    | Some(dir) => List.keep(pins, pin => Pin.getDirection(pin) == dir)
    })
  ->(
    pins =>
      switch pins {
      | list{onlyPin} => Some(onlyPin)
      | _ => None
      }
  )

@module("../dist/index.js")
external _getAttachments: t => array<Attachment.t> = "getPatchAttachments"

let getAttachments = t => _getAttachments(t)->List.fromArray

let getTabtestContent = t =>
  getAttachments(t)->List.keep(Attachment.isTabtest)->List.head->Option.map(Attachment.getContent)

let hasTabtest = t => getAttachments(t)->List.some(Attachment.isTabtest)

@module("../dist/index.js")
external isNotImplementedInXod: t => bool = "isPatchNotImplementedInXod"

@module("../dist/index.js") external isRecord: t => bool = "isRecordPatch"
@module("../dist/index.js") external isUnpackRecord: t => bool = "isUnpackRecordPatch"

let isTerminal = patch => patch->getPath->PatchPath.isTerminal
let isJumper = patch => patch->getPath->PatchPath.isJumper
let isBus = patch => patch->getPath->PatchPath.isBus
let isFromBus = patch => patch->getPath->PatchPath.isFromBus
let isToBus = patch => patch->getPath->PatchPath.isToBus
@module("../dist/index.js") external isAbstract: t => bool = "isAbstractPatch"
