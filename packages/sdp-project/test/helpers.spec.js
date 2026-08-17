import R from 'ramda';
import RamdaFantasy from 'ramda-fantasy';
import chai from 'chai';

import * as Helper from './helpers.js';

const { Either } = RamdaFantasy;

const { assert } = chai;

describe('Helpers', () => {
  describe('expectEither', () => {
    const leftObj = new Error('LEFT');
    const rightObj = { name: 'right' };

    // eslint-disable-next-line new-cap
    const left = Either.Left(leftObj);
    // eslint-disable-next-line new-cap
    const right = Either.Right(rightObj);

    it('should throw Left value', () => {
      const eitherLeft = () => Helper.expectEitherRight(R.identity, left);
      assert.throws(eitherLeft, Error, 'LEFT');
    });
    it('should return Right value', () => {
      Helper.expectEitherRight((val) => assert.deepEqual(val, rightObj), right);
    });
  });
});
