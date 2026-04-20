// BMRouter is shaped as (function(global){…})(window) and assigns global.BMRouter.
// We evaluate the source with a synthetic `global` object and extract the binding.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(HERE, '..', 'src', 'BareMetalRouting.js'), 'utf8');
const sandbox = {};
const factory = new Function('window', 'document', 'history', 'location', `"use strict"; ${code}; return window.BMRouter;`);
const BMRouter = factory(
  sandbox,
  typeof document !== 'undefined' ? document : undefined,
  typeof history  !== 'undefined' ? history  : undefined,
  typeof location !== 'undefined' ? location : undefined
);
export default BMRouter;
export { BMRouter };
