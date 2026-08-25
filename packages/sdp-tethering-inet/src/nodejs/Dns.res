type t
type host = string
type ip = string
type dns = {
  address: ip,
  family: int,
}

@module("dns") external dnsPromises: t = "promises"

@send external lookup_: (t, host) => promise<dns> = "lookup"

let lookup = host => lookup_(dnsPromises, host)->Promise.then(res => Promise.resolve(res.address))
