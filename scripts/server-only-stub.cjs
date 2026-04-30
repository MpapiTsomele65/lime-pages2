// Resolve `server-only` to a no-op when running scripts under tsx/node.
//
// The `server-only` package throws at import time so it can't be bundled
// into client code by Next.js. Our lib/* helpers use it as a guard rail.
// Scripts under scripts/*.ts run in node (already server) but still
// import those helpers, so we redirect the require to the noop stub.
//
// Usage:
//   npx tsx --require ./scripts/server-only-stub.cjs scripts/foo.ts
const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") {
    return require.resolve("./server-only-noop.cjs");
  }
  return orig.call(this, request, ...rest);
};
