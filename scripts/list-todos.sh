#!/bin/bash

grep -r --include '*.js' -E -o 'TODO (.*)' src test
