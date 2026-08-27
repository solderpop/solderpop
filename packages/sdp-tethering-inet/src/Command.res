// Warning 44 (open-statement shadows an identifier): intentional, this
// file uses Belt's Option/Array/Result, not ReScript's built-in ones.
@@warning("-44")
open Belt

type t =
  | AT
  | CIPSTATUS
  | CIFSR
  | CIPMUX(bool)
  | PING(Connection.Host.t)
  | CIPDOMAIN(Connection.Host.t)
  | CIPSTART(Connection.Link.t, Connection.t)
  | CIPSEND(Connection.Link.t, int)
  | CIPCLOSE(Connection.Link.t)

// Stringifiers

let stringifyOptionalLink = (link, prefix: string) =>
  link > 0 ? prefix ++ (String.make(link) ++ ",") : ""

let stringify = cmd =>
  switch cmd {
  | AT => "AT"
  | CIPSTATUS => "AT+CIPSTATUS"
  | CIFSR => "AT+CIFSR"
  | CIPDOMAIN(domain) => "AT+CIPDOMAIN=\"" ++ (domain ++ "\"")
  | CIPMUX(a) => "AT+CIPMUX=" ++ (a ? "1" : "0")
  | PING(a) => "AT+PING=" ++ a
  | CIPSTART(link, conn) =>
    "AT+CIPSTART=" ++ (stringifyOptionalLink(link, "") ++ Connection.stringify(conn))
  | CIPSEND(link, len) => "AT+CIPSEND=" ++ (stringifyOptionalLink(link, "") ++ String.make(len))
  | CIPCLOSE(link) => "AT+CIPCLOSE" ++ stringifyOptionalLink(link, "=")
  }

// Utils
let startsWith = Js.String.startsWith

let isEnquoted = (str: string): bool =>
  str->String.charAt(0) == "\"" && str->String.charAt(String.length(str) - 1) == "\""

let unquote = (str: string): string =>
  switch str {
  | a if isEnquoted(a) => String.slice(a, ~start=1, ~end=String.length(a) - 1)
  | a => a
  }

let parseArguments = (str: string): array<string> =>
  switch str->String.match(/(?:(?:=|,)(.+))$/) {
  // Array indexing is bounds-checked (option-wrapped) on top of the capture
  // group itself already being optional, hence the double Some.
  | Some(result) =>
    switch result[1] {
    | Some(Some(args)) => args->String.split(",")->Belt.Array.keep(s => s !== "")
    | _ => []
    }
  | None => []
  }

let parseFirstArgAsBool = (str: string): Result.t<bool, Error.t> =>
  str
  ->parseArguments
  ->(
    args =>
      switch args {
      | ["0"] => Result.Ok(false)
      | ["1"] => Result.Ok(true)
      | [] => Result.Error(Error.EXPECTED_ARGUMENTS(1))
      | _ => Result.Error(Error.INVALID_ARGUMENTS)
      }
  )

let parseQuotedFirstArgument = (str: string): Result.t<string, Error.t> =>
  str
  ->parseArguments
  ->(
    args =>
      switch args {
      | [a] if isEnquoted(a) => Result.Ok(unquote(a))
      | [] => Result.Error(Error.EXPECTED_ARGUMENTS(1))
      | _ => Result.Error(Error.INVALID_ARGUMENTS)
      }
  )

let parseInt = (str: string): Result.t<int, Error.t> =>
  switch str->Int.fromString {
  | Some(a) => Result.Ok(a)
  | None => Result.Error(Error.INVALID_ARGUMENTS)
  }

let isInt = (str: string): bool => str->Int.fromString->Option.isSome

// Command constructor

let createConnection = (connectionType, host, port, ~keepAlive="0", ~linkId="0", ()) => {
  let host_ = host->unquote->Connection.Host.validate
  let port_ = port->Connection.Port.fromString
  let keepAlive_ = Connection.KeepAlive.fromString(keepAlive)
  let linkId_ = Connection.Link.fromString(linkId, false)

  BeltHoles.Result.liftM3(
    (vIp, vPort, vKeepAlive) => Connection.create(unquote(connectionType), vIp, vPort, vKeepAlive),
    host_,
    port_,
    keepAlive_,
  )->BeltHoles.Result.lift2((vLinkId, vConnection) => CIPSTART(vLinkId, vConnection), linkId_, _)
}

let parse = (str): Result.t<t, Error.t> =>
  switch str {
  | "AT" => Result.Ok(AT)
  | "AT+CIPSTATUS" => Result.Ok(CIPSTATUS)
  | "AT+CIFSR" => Result.Ok(CIFSR)
  | a if startsWith("AT+CIPMUX", a) => parseFirstArgAsBool(a)->Result.map(a => CIPMUX(a))
  | a if startsWith("AT+PING", a) => parseQuotedFirstArgument(a)->Result.map(a => PING(a))
  | a if startsWith("AT+CIPDOMAIN", a) => parseQuotedFirstArgument(a)->Result.map(a => CIPDOMAIN(a))
  | a if startsWith("AT+CIPSTART", a) =>
    a
    ->parseArguments
    ->(
      args =>
        switch args {
        | [linkId, connectionType, host, port] if isInt(linkId) =>
          createConnection(connectionType, host, port, ~linkId, ())
        | [linkId, connectionType, host, port, keepAlive] if isInt(linkId) =>
          createConnection(connectionType, host, port, ~linkId, ~keepAlive, ())
        | [connectionType, host, port, keepAlive] =>
          createConnection(connectionType, host, port, ~keepAlive, ())
        | [connectionType, host, port] => createConnection(connectionType, host, port, ())
        | [_]
        | [_, _]
        | [] =>
          Result.Error(Error.EXPECTED_ARGUMENTS(3))
        | args if Array.length(args) > 5 => Result.Error(Error.EXPECTED_ARGUMENTS(3))
        | _ => Result.Error(Error.INVALID_ARGUMENTS)
        }
    )
  | a if startsWith("AT+CIPSEND", a) =>
    a
    ->parseArguments
    ->(
      args =>
        switch args {
        | [linkId, dataLength] if isInt(linkId) =>
          let linkId_ = linkId->Connection.Link.fromString(false)
          let len_ = dataLength->parseInt
          BeltHoles.Result.lift2((vLink, vLen) => CIPSEND(vLink, vLen), linkId_, len_)
        | [dataLength] => dataLength->parseInt->Result.map(len => CIPSEND(0, len))
        | [] => Result.Error(Error.EXPECTED_ARGUMENTS(1))
        | _ => Result.Error(Error.INVALID_ARGUMENTS)
        }
    )
  | a if startsWith("AT+CIPCLOSE", a) =>
    a
    ->parseArguments
    ->(
      args =>
        switch args {
        | [] => Result.Ok(CIPCLOSE(0))
        | [linkId] if isInt(linkId) =>
          linkId->Connection.Link.fromString(true)->Result.map(vLink => CIPCLOSE(vLink))
        | args if Array.length(args) > 1 => Result.Error(Error.EXPECTED_ARGUMENTS(1))
        | _ => Result.Error(Error.INVALID_ARGUMENTS)
        }
    )
  | _ => Result.Error(Error.UNKNOWN_COMMAND)
  }
