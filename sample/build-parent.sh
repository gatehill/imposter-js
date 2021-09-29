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
