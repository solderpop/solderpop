type t

@new @module("events") external create: unit => t = "EventEmitter"

@send external emit: (t, string, string) => bool = "emit"

@send external on: (t, string, 'a => unit) => t = "on"
