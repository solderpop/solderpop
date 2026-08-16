type t

@new @module external create: unit => t = "events"

@send external emit: (t, string, string) => bool = "emit"

@send external on: (t, string, 'a => unit) => t = "on"
