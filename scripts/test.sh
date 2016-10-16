#!/bin/bash

set -e

node bin/kanu.js \
  --require test/support/boot.js \
  --reporter dot \
  --extensions .js \
  test/unit test/integration

eslint src test
