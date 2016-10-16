export default function expose (target, api) {
  const original = {}
  for (const key in api) {
    if (key in target) {
      original[key] = target[key]
    }
    target[key] = api[key]
  }

  return function unexpose () {
    for (const key in api) {
      if (key in original) {
        target[key] = original[key]
      } else {
        delete target[key]
      }
    }
  }
}
