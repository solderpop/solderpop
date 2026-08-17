@module("address") external ip: unit => string = "ip"

@module("address") @val
external mac_: (('err, 'mac) => unit) => unit = "mac"

let mac = () =>
  Promise.make((resolve, reject) =>
    mac_((err, res) =>
      err
      ->Nullable.toOption
      ->(
        oErr =>
          switch oErr {
          | Some(e) => reject(e)
          | None => resolve(res)
          }
      )
    )
  )
