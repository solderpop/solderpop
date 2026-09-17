#!/usr/bin/env bash

for projectfile in ./workspace/__lib__/xod*/*/project.sdp; do
  jq -M ".version=\"$XOD_NEW_VERSION\"" < "$projectfile" | sponge "$projectfile"
done
