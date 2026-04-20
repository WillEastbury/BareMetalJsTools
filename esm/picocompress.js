// Re-exports the upstream picocompress JS port (vendored verbatim).
// Source: https://github.com/WillEastbury/picocompress (MIT)
export { compress, decompress, compressBound, PROFILES } from '../src/vendor/picocompress/picocompress.mjs';
export { default as PicoCompress }                       from '../src/vendor/picocompress/picocompress.mjs';
