import { addError } from '../messages/actions.js';
import formatUnexpectedError from '../messages/formatUnexpectedError.js';

export default () => next => action => {
  try {
    return next(action);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);

    return next(addError(formatUnexpectedError(err)));
  }
};
