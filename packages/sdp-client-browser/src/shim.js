// This file is wired in as its own webpack entry point (see
// sdp-client/webpack.config.cjs) specifically to hold environment
// shims/patches that must run before the rest of the app bundle.
//
// It previously patched babel-runtime/regenerator to work around a
// redux-api-middleware + Babel 6 bug (see git history). Both are gone
// from this codebase now -- redux-api-middleware isn't a dependency
// anymore, and this repo migrated off Babel 6 long ago -- so the patch
// no longer applies. Left empty (rather than deleted) since it's still
// a live webpack entry point; removing it outright would need touching
// the shared webpack config too, out of scope for this cleanup.
