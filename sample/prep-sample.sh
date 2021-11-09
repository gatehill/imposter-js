#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SAMPLE_DIR="${SCRIPT_DIR}/tmp/imposter"
NEW_MODULE_PATH="file:./tmp/imposter"

function package_dep() {
  if [[ -d ./tmp ]]; then
    rm -rf ./tmp
  fi

  mkdir -p ./tmp

  pushd ../
  npm install
  npm run build
  popd || exit 1

  cp -r ../dist "${SAMPLE_DIR}"
  cp ../package.json "${SAMPLE_DIR}"
}

function set_dep_version() {
  MODIFIED_PKG_JSON=$(jq --arg moduleVer "${NEW_MODULE_PATH}" '.devDependencies["@imposter-js/imposter"] = ($moduleVer)' ./package.json)
  echo "${MODIFIED_PKG_JSON}" | jq > ./package.json
}

function set_main_path() {
  MODIFIED_PKG_JSON=$(jq '.main = "index.js"' "${SAMPLE_DIR}/package.json")
  echo "${MODIFIED_PKG_JSON}" | jq > "${SAMPLE_DIR}/package.json"
}

cd "${SCRIPT_DIR}"

package_dep
set_dep_version
set_main_path
