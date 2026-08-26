// This file is a WASM web worker implementation.
// The worker is imported as a usual JS module by worker-loader.
// In this case tests fail with ReferenceError "self is not defined".
// To avoid this we define _self as self for worker, or an empty object
// for tests and etc.
// eslint-disable-next-line
var _self = (typeof self === 'undefined') ? {} : self;

// Serial object provides communication between WASM and JS
// It used only in Simulation, but to avoid creating similar
// worker file for Tabtests it's here permanently.
const Serial = {
  // eslint-disable-next-line no-undef
  encoder: new TextEncoder('utf-8'),
  // eslint-disable-next-line no-undef
  decoder: new TextDecoder('utf-8'),
  txBuffer: new Uint8Array(0),
  // Methods to be called from WASM
  wasm: {
    // How much bytes are available to read
    available: () => Serial.txBuffer.length,
    peek: () => {
      if (Serial.txBuffer.length === 0) {
        return -1;
      }
      return Serial.txBuffer.slice(0, 1);
    },
    // Read Bytes from JS into WASM (called by WASM)
    readBytes: (bytes) => {
      const result = Serial.txBuffer.slice(0, bytes);
      Serial.txBuffer = Serial.txBuffer.slice(bytes);
      return result;
    },
    // Receive Smth from WASM into JS
    writeString: (str) => Serial.onReceive(str),
    writeByte: (byte) =>
      Serial.onReceive(Serial.decoder.decode(new Uint8Array([byte]))),
  },
  // Methods to be called from JS
  js: {
    // Write String to send to WASM
    writeString: (str) => {
      const newStr = Serial.encoder.encode(str);
      const newBuf = new Uint8Array(Serial.txBuffer.length + newStr.length);
      newBuf.set(Serial.txBuffer, 0);
      newBuf.set(newStr, Serial.txBuffer.length);
      Serial.txBuffer = newBuf;
      return Serial.txBuffer.length;
    },
  },
  // JS Handlers
  onReceive: (data) =>
    _self.postMessage({
      type: 'serial:receive',
      payload: data,
    }),
};

// Time object provides a way to pass the millis() into simulation
// It used only in Simulation, because Tabtests may mock the time
// for testing purposes.
const Time = {
  value: 0,
  get: () => Time.value,
  set: (newT) => {
    Time.value = newT;
  },
};

let wasmInstance;
_self.onmessage = (e) => {
  switch (e.data.type) {
    case 'init': {
      const { suite, runtimeUrl, wasmUrl } = e.data.payload;
      _self.importScripts(runtimeUrl);
      const opts = Object.assign(suite, {
        // Serial/Time must be reachable via `Module.Serial`/`Module.Time`
        // from the moment the compiled program's main()/setup() runs, not
        // assigned afterward: modern Emscripten's MODULARIZE output
        // instantiates asynchronously (the factory below returns a Promise,
        // not a ready-to-use instance), and main() can run as soon as the
        // wasm finishes compiling — potentially before any code after the
        // factory call would get a chance to run. Passing them in `opts`
        // (which Emscripten merges onto its internal Module object up
        // front) guarantees they're already there.
        Serial,
        Time,
        // Make possible downloading of wasmFile from dedicated webserver:
        locateFile: () => wasmUrl,
        onAbort: (x) =>
          _self.postMessage({
            type: 'abort',
            payload: x,
          }),
        print: (x) =>
          _self.postMessage({
            type: 'data',
            payload: x,
          }),
        printErr: (x) =>
          _self.postMessage({
            type: 'error',
            payload: x,
          }),
        quit: (exitCode) =>
          _self.postMessage({
            type: 'quit',
            payload: exitCode,
          }),
        // NOTE: deliberately no `postRun` handler here. postRun fires once
        // main() returns, which — for a live Simulation build — happens
        // right after registering emscripten_set_main_loop(), not when the
        // simulation is actually done running. Calling `quit()` there would
        // end the session immediately after it starts. `quit` is still
        // wired above for the case the runtime genuinely exits (a fatal
        // internal error); normal session teardown goes through
        // `worker.terminate()` in editor/actions.js's abortSimulation,
        // matching the browser Worker API, not this callback.
      });

      // Module is defined in `importScripts(...)`, and Emscripten's own
      // convention is to call it as a plain factory function, not `new`.
      // eslint-disable-next-line no-undef, new-cap
      Promise.resolve(Module(opts)).then((instance) => {
        wasmInstance = instance;
        // Make Time updating each millisecond
        setInterval(() => {
          wasmInstance.Time.value += 1;
        }, 1);
      });
      return;
    }
    case 'serial:send': {
      const newLen = Serial.js.writeString(e.data.payload);
      _self.postMessage({
        type: 'serial:sendOk',
        payload: newLen,
      });
      break;
    }
    default:
  }
};
