import chai from 'chai';
import * as H from './helpers.js';
import * as XP from '../src/index.js';

const { assert } = chai;

// assume that nodes have an unique combination of
// type, label and position
const calculateNodeIdForStructuralComparison = (node) => {
  const type = XP.getNodeType(node);
  const label = XP.getNodeLabel(node);
  const position = XP.getNodePosition(node);

  return `${type}~~~${label}~~~${position.x}_${position.y}`;
};

describe('expandVariadicNodes', () => {
  it('expands a simple variadic patch', () => {
    const project = H.loadSolderball('./fixtures/expanding.solderball');
    const expandedProject = XP.expandVariadicNodes('@/main', project);

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/my-variadic', expandedProject),
      XP.getPatchByPathUnsafe('@/my-variadic', project),
      'expanded patch should not change'
    );

    const expected = H.loadSolderball(
      './fixtures/expanding.expected.solderball'
    );

    assert.sameMembers(
      XP.listPatchPaths(expandedProject),
      XP.listPatchPaths(expected)
    );

    assert.deepEqual(
      XP.getPatchByPathUnsafe('@/main', expandedProject),
      XP.getPatchByPathUnsafe('@/main', expected),
      'expanded node type should be updated'
    );

    const expandedPatch = XP.getPatchByPathUnsafe(
      '@/my-variadic-$5',
      expandedProject
    );
    const expectedExpandedPatch = XP.getPatchByPathUnsafe(
      '@/my-variadic-$5',
      expected
    );

    H.assertPatchesAreStructurallyEqual(
      calculateNodeIdForStructuralComparison,
      expandedPatch,
      expectedExpandedPatch
    );
  });
});
