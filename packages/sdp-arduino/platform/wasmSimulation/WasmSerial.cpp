#include "WasmSerial.h"
#include <emscripten.h>

WasmSerialClass WasmSerial;

// Reads one raw byte straight off Module.Serial.wasm.readBytes(1) rather
// than using Module.Serial.wasm.peek() (which returns -1 or a Uint8Array —
// not a shape EM_JS can marshal cleanly to a C int). WasmSerialClass keeps
// its own single-byte lookahead cache (`peeked`) to implement peek() on
// top of this instead.
EM_JS(int, wasmSerialReadByte, (), {
  var bytes = Module.Serial.wasm.readBytes(1);
  return (bytes && bytes.length) ? bytes[0] : -1;
});

EM_JS(int, wasmSerialAvailable, (), { return Module.Serial.wasm.available(); });

EM_JS(void, wasmSerialWriteByte, (int b), { Module.Serial.wasm.writeByte(b); });

EM_JS(double, wasmTimeGet, (), { return Module.Time.get(); });

int WasmSerialClass::available() {
  int n = wasmSerialAvailable();
  return peeked >= 0 ? n + 1 : n;
}

int WasmSerialClass::read() {
  if (peeked >= 0) {
    int b = peeked;
    peeked = -1;
    return b;
  }
  return wasmSerialReadByte();
}

int WasmSerialClass::peek() {
  if (peeked < 0) {
    peeked = wasmSerialReadByte();
  }
  return peeked;
}

size_t WasmSerialClass::write(uint8_t b) {
  wasmSerialWriteByte(b);
  return 1;
}

uint32_t millis() {
  return (uint32_t)wasmTimeGet();
}

uint32_t micros() {
  return millis() * 1000;
}
