#!/bin/bash

set -e

./node_modules/.bin/babel-node bin/kanu \
  --require test/support/boot.js \
  --watch \
  --extensions .js \
  test/unit test/integration \
  "$@"
