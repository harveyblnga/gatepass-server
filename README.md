# Gatepass Server

> For the story behind this project, see the
> [Gatepass README](https://github.com/harveyblnga/gatepass#story).

Minimal in-memory Node.js server for the [Gatepass](https://github.com/harveyblnga/gatepass)
Flutter gate-control prototype. It holds a single shared gate state
(`idle` or `open_requested`) in memory — no database, no persistence across
restarts — and exposes it over both a small REST API and an MCP tool.

```
[Remote Control app] --POST /gate/open--> [this server] <--poll GET /gate/status-- [Gate Device app]
                                                ^
                                    POST /mcp (open_gate tool)
```

## Endpoints

- `POST /gate/open`
- `GET /gate/status`
- `POST /gate/ack`
- `GET /health`
- `POST /mcp`

## Setup

```bash
npm install
npm start
```

## Development

```bash
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set values if needed.

- `PORT` defaults to `3000`
- `GATE_API_KEY` is optional

If `GATE_API_KEY` is set, `POST /gate/open`, `GET /gate/status`, and `POST /gate/ack` accept either:

- `Authorization: Bearer <GATE_API_KEY>`
- `x-api-key: <GATE_API_KEY>`

If `GATE_API_KEY` is not set, requests are allowed normally.

**Note:** `POST /mcp` does not currently check `GATE_API_KEY` — the
`open_gate` MCP tool is reachable without a credential regardless of that
setting. This is a known limitation of the prototype, not an oversight; if
you need the MCP endpoint gated too, add the same `requireGateKey`
middleware used on the REST routes before deploying anywhere untrusted.

## Testing with MCP Inspector

Install and run the Inspector against the local MCP endpoint:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

If you already have the Inspector installed locally, use its launch command instead and point it at:

```text
http://localhost:3000/mcp
```

In the Inspector:

1. Connect to `http://localhost:3000/mcp`
2. Open the tools list
3. Confirm `open_gate` is discovered
4. Invoke `open_gate`
5. Check `GET /gate/status` and confirm it returns `{"status":"open_requested"}`

## Status

This is a working prototype: no database, no request logging beyond
`console.log`, and no rate limiting. CORS is wide open (all origins
allowed). Treat it as a starting point rather than a production-ready
server.

## Production deployments

This repository is deliberately a prototype — it exists to share and
open-source the concept.

We also have a hardened version of this architecture designed for
production and higher-security deployments, where existing gate or
access-control infrastructure can use GSM as the integration layer.

If you have an existing gate deployment that you'd like to make remotely
or programmatically accessible, reach out: harvey@blnga.co.zw. We can talk
through the security model, live deployment, monitoring, and reporting.

## License

MIT — see [LICENSE](LICENSE).
