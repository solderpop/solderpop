import chai from 'chai';
import initialState from '../src/core/state.js';

const { assert } = chai;

describe('Initial state', () => {
  describe('should have reducers:', () => {
    it('project', () => {
      assert.hasAnyKeys(initialState, ['project']);
    });
    it('editor', () => {
      assert.hasAnyKeys(initialState, ['editor']);
    });
    it('errors', () => {
      assert.hasAnyKeys(initialState, ['errors']);
    });
  });
});
