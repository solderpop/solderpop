type t
type port = int
type host = string

@module("net") @val external connect: (port, string) => t = "connect"

@send external write: (t, string) => bool = "write"
@send external on_: (t, string, 'a => _) => unit = "on"

let on = (session: t, event: string, cb: 'a => _): t => {
  session->on_(event, cb)
  session
}

@send external disconnect_: (t, string) => t = "end"

let disconnect = (str: string, session: t) =>
  Promise.make((resolve, reject) => {
    session->on_("error", err => reject(err))
    session->on_("close", _ => resolve(session))
    session->disconnect_(str)->ignore
  })

@send external setKeepAlive: (t, bool, int) => t = "setKeepAlive"
@send external setTimeout: (t, int) => t = "setTimeout"
@send external setEncoding: (t, string) => t = "setEncoding"

@get external localIp: t => host = "localAddress"

@get external localPort: t => port = "localPort"

@get external remoteIp: t => host = "remoteAddress"

@get external remotePort: t => port = "remotePort"

// Internet-available

// "internet-available"'s CJS module.exports is a bare function. ReScript's
// `@module` binding with no field name compiles to a namespace import
// (`import * as X`) under esmodule output, and a namespace object is never
// callable even when the underlying CJS export was — breaks under both
// real ESM and Babel's CJS-transformed output. `isAvailable` is already
// async, so resolve this via a lazy dynamic `import()` instead, which is
// valid ESM and sidesteps the whole-module-binding codegen issue.
let isAvailable = %raw(`
  function () {
    return import('internet-available').then(function (mod) {
      var fn = mod.default || mod;
      return fn();
    });
  }
`)

// Tcp-ping

module Ping = {
  type params = {address: string}
  type response = {
    address: string,
    port: int,
    attempts: int,
    avg: float,
    max: float,
    min: float,
  }
}

@module("tcp-ping") @val
external ping_: (Ping.params, ('err, 'data) => unit) => unit = "ping"

let ping = (host: host): promise<Ping.response> =>
  Promise.make((resolve, reject) =>
    ping_({address: host}, (err, data) =>
      switch Nullable.toOption(err) {
      | Some(err) => reject(err)
      | None => resolve(data)
      }
    )
  )

let getAveragePing = (pingData: Ping.response): float => pingData.avg
