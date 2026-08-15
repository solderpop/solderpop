#ifndef WASM_SERIAL_H
#define WASM_SERIAL_H

#include <Arduino.h>

// Bridges Arduino's Serial API to the JS-side Module.Serial/Module.Time
// objects that packages/sdp-client/src/workers/wasm.worker.js attaches to
// the Emscripten Module instance at runtime (see wasm.worker.js:105-106).
// That JS contract is fixed/pre-existing and NOT modified by this file —
// only the small `wasm` sub-object's methods are called from here, exactly
// as wasm.worker.js already exposes them:
//   Module.Serial.wasm.available() -> number of buffered bytes
//   Module.Serial.wasm.readBytes(n) -> Uint8Array, consumes n bytes
//   Module.Serial.wasm.writeByte(b) -> emits one byte to the JS side
//   Module.Time.get() -> current simulated millis() value
class WasmSerialClass : public HardwareSerial {
  public:
    void begin(uint32_t baud) override {}
    void end() override {}

    int available() override;
    int read() override;
    int peek() override;
    size_t write(uint8_t b) override;

  private:
    int peeked = -1;
};

extern WasmSerialClass WasmSerial;

#endif
