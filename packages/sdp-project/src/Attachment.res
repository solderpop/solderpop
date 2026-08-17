type t

@module("..") external getFilename: t => string = "getAttachmentFilename"

@module("..") external getContent: t => string = "getAttachmentContent"

@module("..") external getEncoding: t => string = "getAttachmentEncoding"

let isTabtest = att => getFilename(att) == "patch.test.tsv"
