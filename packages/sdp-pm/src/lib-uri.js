// TODO: duplicates sdp-cli/lib-uri.js

import RamdaFantasy from 'ramda-fantasy';

const { Maybe } = RamdaFantasy;

export const createLibUri = (orgname, libname, tag) => ({
  orgname,
  libname,
  tag,
});

export const parseLibUri = (string) =>
  Maybe.toMaybe(string.match(/^([^@/]+?)\/([^@/]+?)(?:@([^@/]+?))?$/)).map(
    ([, orgname, libname, tag]) =>
      createLibUri(orgname, libname, tag || 'latest')
  );

export const toStringWithoutTag = (libUri) =>
  `${libUri.orgname}/${libUri.libname}`;

export const toString = (libUri) =>
  `${toStringWithoutTag(libUri)}@${libUri.tag}`;
