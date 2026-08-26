import { composeErrorFormatters } from 'sdp-func-tools';
import { messages as xpMessages } from 'sdp-project';
import { messages as xdMessages } from 'sdp-deploy';
import { messages as xdbMessages } from 'sdp-deploy-bin';
import { messages as xardMessages } from 'sdp-arduino';
import { messages as xfMessages } from 'sdp-fs';

import uploadMessages from '../upload/messages.js';

export const formatErrorMessage = composeErrorFormatters([
  xpMessages,
  xdMessages,
  xdbMessages,
  xardMessages,
  xfMessages,
  uploadMessages,
]);

export const formatLogError = (error) => {
  const stanza = formatErrorMessage(error);
  return [
    ...(stanza.title ? [stanza.title] : []),
    ...(stanza.path ? [stanza.path.join(' -> ')] : []),
    ...(stanza.note ? [stanza.note] : []),
    ...(stanza.solution ? [stanza.solution] : []),
  ].join('\n');
};
