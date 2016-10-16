#!/bin/bash

set -e

babel-node src/cli.js \
  --reporter spec \
  --extensions .js \
  "$@"
