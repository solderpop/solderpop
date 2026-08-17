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

let isAvailable = %raw(` require("internet-available") `)

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
