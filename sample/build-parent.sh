#!/usr/bin/env bash

if [[ -d ./tmp ]]; then
  rm -rf ./tmp/parent
fi

mkdir -p ./tmp

pushd ../
npm install
npm run build
popd || exit 1

cp -r ../dist ./tmp/parent
cp ../package.json ./tmp/parent

MODIFIED_PKG_JSON=$(jq --arg moduleVer "${NEW_MODULE_PATH}" '.main = "index.js"' ./tmp/parent/package.json)
echo "${MODIFIED_PKG_JSON}" | jq > ./tmp/parent/package.json
