# Gatepass Server

Minimal in-memory Node.js server for the Flutter gate-control prototype.

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
