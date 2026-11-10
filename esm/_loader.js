// Internal browser ESM loader. Uses fetch plus in-page evaluation; no Node APIs.
export async function loadIife(filename, namespace) {
  const url = new URL('../src/' + filename, import.meta.url);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Module load failed: HTTP ' + response.status);
  const code = await response.text();
  const execute = new Function(
    'globalThis', 'window', 'document', 'history', 'location', 'fetch',
    '"use strict";\n' + code + '\nreturn globalThis.BareMetal && globalThis.BareMetal[' +
      JSON.stringify(namespace) + '];'
  );
  const root = typeof globalThis !== 'undefined' ? globalThis : window;
  return execute(
    root,
    root.window || root,
    root.document,
    root.history,
    root.location,
    root.fetch
  );
}
