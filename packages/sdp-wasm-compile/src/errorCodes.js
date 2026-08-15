// Reuses sdp-cloud-compile's WASM_* codes where the meaning carries over
// directly (same client-side consumers — sdp-client/src/editor/actions.js,
// sdp-client/src/debugger/reducer.js — key off these code strings), and adds
// codes specific to the local toolchain.
export const EMCC_NOT_FOUND = 'EMCC_NOT_FOUND';
export const WASM_COMPILATION_ERROR = 'WASM_COMPILATION_ERROR';
export const WASM_UNKNOWN_COMPILATION_ERROR = 'WASM_UNKNOWN_COMPILATION_ERROR';
