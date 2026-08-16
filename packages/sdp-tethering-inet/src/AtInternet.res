// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's List/Option, not ReScript's built-in ones.
@@warning("-44")
open Belt

type openConnections = List.t<(Connection.Link.t, Net.t)>

// :: (Link, Bytes to send, Bytes sent)
type sending = (Connection.Link.t, int, int)

type t = {
  mux: ref<bool>,
  sending: ref<sending>,
  connections: ref<openConnections>,
  events: EventEmitter.t,
}

let getDefaultState = () => {
  let state: t = {
    mux: ref(false),
    sending: ref((-1, 0, 0)),
    connections: ref(list{}),
    events: EventEmitter.create(),
  }
  state
}

// UTILS
let resolve = Promise.resolve

// METHODS

let hasConnection = (state, linkId) => List.hasAssoc(state.connections.contents, linkId, (a, b) => a == b)
let hasConnections = state => List.length(state.connections.contents) > 0
let isMux = state => state.mux.contents

let listen = (state, linkId, handler) =>
  List.getAssoc(state.connections.contents, linkId, (a, b) => a == b)
  ->Option.map(session => session->Net.on("data", handler))
  ->Option.isSome

let handleCommand = (state: t, cmd: Command.t): promise<string> =>
  switch cmd {
  | AT => resolve("OK")
  | CIPMUX(a) =>
    if !hasConnections(state) {
      state.mux := a
      resolve("OK")
    } else {
      resolve("ERR")
    }
  | CIFSR =>
    Address.mac()->Promise.then(mac =>
      resolve(
        "+CIFSR:STAIP,\"" ++
        (Address.ip() ++
        ("\"" ++ ("\n" ++ ("+CIFSR:STAMAC,\"" ++ (mac ++ ("\"" ++ "\n")))))),
      )
    )
  | CIPSTATUS =>
    // TODO: Add info about opened connections
    Net.isAvailable()
    ->Promise.then(_ => resolve("STATUS:2"))
    ->Promise.catch(_ => resolve("SATUS:5"))
  | PING(host) =>
    Net.ping(host)
    ->Promise.then(data =>
      resolve("+" ++ ((data->Net.getAveragePing->Int.fromFloat->String.make) ++ "\nOK"))
    )
    ->Promise.catch(_ => resolve("+timeout\nERROR"))
  | CIPDOMAIN(host) =>
    host
    ->Dns.lookup
    ->Promise.then(ip => resolve("+CIPDOMAIN:" ++ (ip ++ "\nOK")))
    ->Promise.catch(_ => resolve("DNS Fail\nERROR"))
  | CIPSTART(linkId, connection) =>
    if !isMux(state) && linkId !== 0 {
      resolve("ERROR")
    } else if hasConnection(state, linkId) {
      resolve("ALREADY CONNECTED")
    } else {
      let session = Connection.establish(connection)
      Promise.make((resolve, reject) =>
        session
        ->Net.on("connect", () => {
          state.connections := List.setAssoc(state.connections.contents, linkId, session, (a, b) => a == b)
          // Pass the socket data into main data stream
          listen(state, linkId, data => {
            let dataLen = String.length(data)
            state.events->EventEmitter.emit(
              "data",
              "IPD," ++ (String.make(dataLen) ++ (":" ++ data)),
            )
          })->ignore
          resolve("OK")
        })
        ->Net.on("error", err => reject(err))
        ->Net.on("close", () => {
          state.connections := List.removeAssoc(state.connections.contents, linkId, (a, b) => a == b)
          state.events->EventEmitter.emit("data", "CONNETION_CLOSED" ++ String.make(linkId))
        })
        ->ignore
      )->Promise.catch(_ => resolve("ERROR"))
    }
  | CIPSEND(linkId, length) =>
    List.getAssoc(state.connections.contents, linkId, (a, b) => a == b)->(
      connection =>
        switch connection {
        | None => resolve("ERROR")
        | Some(_) =>
          state.sending := (linkId, length, 0)
          resolve("OK\n>")
        }
    )
  | CIPCLOSE(5) =>
    List.map(state.connections.contents, ((_, session)) => session->Net.disconnect("", _))
    ->List.toArray
    ->Promise.all
    ->Promise.then(_ => resolve("OK"))
  | CIPCLOSE(linkId) =>
    switch List.getAssoc(state.connections.contents, linkId, (a, b) => a == b) {
    | None => resolve("OK")
    | Some(session) => session->Net.disconnect("", _)->Promise.then(_ => resolve("OK"))
    }
  }

let send = (state, data) => {
  let (linkId, requestLength, sentLength) = state.sending.contents
  List.getAssoc(state.connections.contents, linkId, (a, b) => a == b)->(
    connection =>
      switch connection {
      | None => resolve("ERROR")
      | Some(session) =>
        let written = session->Net.write(data)
        let dataLen = String.length(data)
        let newSentLength = sentLength + dataLen
        state.sending := (linkId, requestLength, newSentLength)

        if written && newSentLength >= requestLength {
          state.sending := (-1, 0, 0)
          resolve("Recv " ++ (String.make(newSentLength) ++ (" bytes\n" ++ ("\n" ++ "SEND OK"))))
        } else if written {
          resolve("")
        } else {
          resolve("ERROR")
        }
      }
  )
}

let execute = (state, cmd) =>
  cmd
  ->Command.parse
  ->(
    res =>
      switch res {
      | Result.Ok(a) => a->handleCommand(state, _)
      | Result.Error(_) => Promise.resolve("ERR")
      }
  )

let isSendingMode = state =>
  switch state.sending.contents {
  | (-1, _, _) => false
  | _ => true
  }

let ensureNl = str =>
  str
  ->String.replaceRegExp(/\\r\\n$/, "\r\n")
  ->String.replaceRegExp(/\\n$/, "\n")
  ->(s => s->String.endsWith("\n") ? s : s ++ "\r\n")

let write = (state, data) =>
  (isSendingMode(state) ? send(state, ensureNl(data)) : execute(state, data))
  ->Promise.then(answer => {
    state.events->EventEmitter.emit("data", answer)->ignore
    resolve(answer)
  })
  ->Promise.catch(_ => {
    state.events->EventEmitter.emit("data", "ERROR")->ignore
    resolve("ERROR")
  })
  ->ignore

let subscribe = (state, handler) => state.events->EventEmitter.on("data", handler)->ignore

let create = (onDataHandler: string => unit): (string => unit) => {
  let state = getDefaultState()
  subscribe(state, onDataHandler)
  data => write(state, data)
}
