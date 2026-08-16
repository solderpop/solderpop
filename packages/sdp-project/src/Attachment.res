type t

@module("../dist/index.js") external getFilename: t => string = "getAttachmentFilename"

@module("../dist/index.js") external getContent: t => string = "getAttachmentContent"

@module("../dist/index.js") external getEncoding: t => string = "getAttachmentEncoding"

let isTabtest = att => getFilename(att) == "patch.test.tsv"
