#!/usr/bin/env node

// TODO use CWD local installation. Look at eslint
try {
  require('../src/cli').default()
} catch (e) {
  require('../lib/cli').default()
}
