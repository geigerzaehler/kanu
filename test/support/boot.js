'use strict'

// TODO use this instead of package.json. But does not work with source
// maps

require('babel-register')({
  plugins: [
    ['module-resolver', {
      'alias': {
        'kanu': './src',
        'support': './test/support',
      },
    }],
  ],
})
