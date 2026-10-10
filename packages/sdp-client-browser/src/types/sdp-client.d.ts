// sdp-client ships untyped JS (dist/); TS callers cast the parts they use,
// e.g. `client.theme as ThemeApi`.
declare module 'sdp-client' {
  const client: Record<string, unknown>;
  export default client;
}
