/* eslint-disable no-console */
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';
import R from 'ramda';

const { mergeDeepRight } = R;

// here we mocks and unmocks the stdout with the stderr for the listr renderers

const updateRender = UpdateRenderer.prototype.render;
UpdateRenderer.prototype.render = function render() {
  // Captured per-call on `this`, not a shared module-level constant --
  // otherwise this goes stale as soon as anything else (e.g. a test's
  // stdout mock) reassigns process.stdout.write later.
  this._realStdoutWrite = process.stdout.write;
  process.stdout.write = (() =>
    function writeMock(buffer) {
      process.stderr.write(buffer);
    })();
  updateRender.apply(this);
};

const updateEnd = UpdateRenderer.prototype.end;
UpdateRenderer.prototype.end = function end(...args) {
  updateEnd.apply(this, args);
  process.stdout.write = this._realStdoutWrite;
};

const verboseRender = VerboseRenderer.prototype.render;
VerboseRenderer.prototype.render = function render() {
  this._realConsoleLog = console.log;
  console.log = (() =>
    function writeMock(str) {
      console.error(str);
    })();
  verboseRender.apply(this);
};

const verboseEnd = VerboseRenderer.prototype.end;
VerboseRenderer.prototype.end = function end() {
  verboseEnd.apply(this);
  console.log = this._realConsoleLog;
};

export const getListr = (verbose = true, tasks = [], opts = {}) =>
  new Listr(
    tasks,
    mergeDeepRight(opts, {
      renderer: verbose ? UpdateRenderer : 'silent',
      nonTTYRenderer: verbose ? VerboseRenderer : 'silent',
    })
  );

export default { getListr };
