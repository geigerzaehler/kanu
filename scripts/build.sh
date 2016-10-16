#!/bin/bash

set -e

babel \
  src \
  --out-dir lib \
  "$@"
