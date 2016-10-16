/**
 * This error is thrown when the user provided some invalid input.
 */
export default function UserError (message) {
  Error.call(this, message)
  this.message = message
}

UserError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: UserError,
    enumerable: false,
    writable: true,
    configurable: true,
  },
})
