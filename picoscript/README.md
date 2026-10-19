# Document WAL PicoScript host

`docwal.pc` is the PicoScript side of `BareMetal.DocumentWAL`. It is a loopback PicoWAL HTTP store. Clients append JSON ops, list them, and compact a snapshot onto a card.

## Packs

| Pack | Contents |
| --- | --- |
| 1 | Document meta |
| 2 | Op log (`{doc, path, value, prev, client, ts, kind}`) |
| 3 | Compacted snapshots (`{doc, seq, snapshot}`) |

Record 0 is the next-id watermark. Payloads are at most 4096 bytes.

## Routes

Same as the picowal app host:

- `GET /list/{pack}`
- `POST /{pack}`
- `GET|PUT|DELETE /{pack}/{record}`

`BareMetal.DocumentWAL.httpTransport("")` speaks this contract. Undo and redo are ordinary ops (`kind: "undo"` or `"set"`). Compact is `POST /3` with the current snapshot.

## PIOS

Publish as capsule pack 1024, process `web`, `io = tcp/82`, `entry = http`. Bytecode must stay within the EL0 4096-byte cap or run on the reference VM (this image is the generic WAL handler and is larger than that cap, same class as the story prototype). A copy lives in the PIOS tree at `examples/docwal.pc`.
