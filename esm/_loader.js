// Internal ESM loader: evaluates an IIFE-style source file and returns the global it defines.
// Works in Node (uses fs). For browsers, use the IIFE files directly via <script src=…>.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC  = join(HERE, '..', 'src');

export function loadIife(filename, varName) {
  const code = readFileSync(join(SRC, filename), 'utf8');
  // Strip the leading `const X = ` and the trailing `;` so we can wrap in (...).
  const body = code
    .replace(new RegExp(`(?:const|var)\\s+${varName}\\s*=\\s*`), '')
    .replace(/;\s*$/, '');
  // Provide a minimal global surface so modules expecting `document`, `window`, `fetch`
  // don't crash at load time (they only *use* them when called).
  const factory = new Function(
    'globalThis', 'window', 'document', 'fetch',
    `"use strict"; return (${body});`
  );
  return factory(
    globalThis,
    typeof window !== 'undefined' ? window : globalThis,
    typeof document !== 'undefined' ? document : undefined,
    typeof fetch !== 'undefined' ? fetch : undefined
  );
}
