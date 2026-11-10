# BareMetal browser coverage

Tests run only in `harness.html` / `run-harness.ps1`. No Node, npm, or Jest.

Client smoke gate: `run-harness.ps1 -Smoke` → `harness.html?manifest=smoke` → `tests/harness-manifest.smoke.js` (stable subset; run on the developer machine, not GitHub Actions). Full manifest (`tests/harness-manifest.js`) is manual until hangers below are fixed.

| Module | Status |
|---|---|
| Auth | behavioural (PKCE, JWT, callback, refresh) — unrun in this push |
| Tokens | behavioural — unrun in this push |
| Workflow | behavioural — unrun in this push |
| REST / compression | behavioural — unrun in this push |
| Components | behavioural — unrun in this push |
| Cache | behavioural — unrun in this push |
| Types | behavioural (ported) |
| Time | behavioural (ported) |
| Bind | behavioural (reactive + m-text) |
| Codes | behavioural (lookups + fetch cache) |
| IDB | behavioural (CRUD, query, kv) |
| Minifier | behavioural (regex, CSS, ASI) |
| TestRunner | singleton / once-per-page |
| Other `tests/browser/*.browser.js` | load/smoke until ported |

Jest `tests/*.test.js` files are removed. Remaining work is converting leftover smokes into behavioural suites under this same harness.
