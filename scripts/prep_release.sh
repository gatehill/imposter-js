#!/usr/bin/env bash
set -e

if [[ $# -lt 1 ]]; then
  echo "Missing release type. Must be one of major, minor or patch"
  exit 1
else
  RELEASE_TYPE="$1"
fi

cd "$( git rev-parse --show-toplevel )"

npm version "$RELEASE_TYPE"

# update lockfile etc.
npm install

NEW_VERSION="$( npm pkg get version | sed 's/"//g' )"
echo -e "New version: ${NEW_VERSION}\nCommit changes and create tag (y/N)?"
read -r CONFIRM_COMMIT
if [[ -z "$CONFIRM_COMMIT" || "y" != "$CONFIRM_COMMIT" ]]; then
  echo "Aborted"
  exit 1
fi

git commit -a -m"build: release ${NEW_VERSION}."
git tag "$NEW_VERSION"
