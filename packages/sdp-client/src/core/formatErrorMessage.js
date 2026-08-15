import { composeErrorFormatters } from 'sdp-func-tools';
import { messages as xpMessages } from 'sdp-project';
import { messages as xardMessages } from 'sdp-arduino';

import formatUnexpectedError from '../messages/formatUnexpectedError';

export default composeErrorFormatters([
  xpMessages,
  xardMessages,
  {
    UNEXPECTED_ERROR: formatUnexpectedError,
  },
]);
