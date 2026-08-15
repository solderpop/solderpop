#include <Arduino.h>
#include <emscripten.h>

// The generated sketch only defines setup()/loop() (standard Arduino
// convention — see packages/sdp-arduino/platform/runtime.cpp's "Entry
// point" section) with no main() of its own; real hardware builds get
// main() for free from the board's Arduino core. There's no such core
// here, so this supplies it: run setup() once, then hand loop() to
// Emscripten's scheduler so it keeps running after main() returns instead
// of executing once and exiting. emscripten_set_main_loop falls back to
// setTimeout-based scheduling automatically when requestAnimationFrame
// isn't available, which is the case here — this runs inside a Web Worker
// (packages/sdp-client/src/workers/wasm.worker.js), and Workers have no
// requestAnimationFrame.
int main() {
  setup();
  emscripten_set_main_loop(loop, 0, 0);
  return 0;
}
