// Duplicate of `composeMessage` from `sdp-client`
// It's necessary to prevent errors with importing `sdp-client`,
// that contains styles and react components.
export default (title, note = null, button = null, persistent = false) => ({
  title,
  note,
  button,
  persistent,
});
