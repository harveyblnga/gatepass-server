const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { McpServer } = require('@modelcontextprotocol/server');
const { NodeStreamableHTTPServerTransport } = require('@modelcontextprotocol/node');
const { createMcpExpressApp } = require('@modelcontextprotocol/express');
const z = require('zod/v4');

const app = express();
const port = process.env.PORT || 3000;
const gateApiKey = process.env.GATE_API_KEY;

let gateState = {
  status: 'idle',
  requestedAt: null,
};

app.use(cors());
app.use(express.json());

function isAuthRequired() {
  return Boolean(gateApiKey);
}

function isAuthorized(req) {
  if (!isAuthRequired()) {
    return true;
  }

  const bearer = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  const expectedBearer = `Bearer ${gateApiKey}`;

  return bearer === expectedBearer || apiKeyHeader === gateApiKey;
}

function requireGateKey(req, res, next) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

function requestGateOpen() {
  const alreadyPending = gateState.status === 'open_requested';

  if (!alreadyPending) {
    gateState.status = 'open_requested';
    gateState.requestedAt = new Date().toISOString();
  }

  console.log('OPEN requested');

  return {
    status: 'open_requested',
    alreadyPending,
  };
}

function buildMcpServer() {
  const server = new McpServer({ name: 'gate-server', version: '1.0.0' });

  server.registerTool(
    'open_gate',
    {
      description: 'Request the configured physical gate to open.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = requestGateOpen();

      return {
        content: [
          {
            type: 'text',
            text: result.alreadyPending
              ? 'Gate open request is already pending.'
              : 'Gate open request sent successfully.',
          },
        ],
      };
    }
  );

  return server;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gate-server' });
});

app.post('/gate/open', requireGateKey, (_req, res) => {
  const result = requestGateOpen();

  if (result.alreadyPending) {
    return res.json({
      ok: true,
      status: 'open_requested',
      alreadyPending: true,
    });
  }

  return res.json({
    ok: true,
    status: 'open_requested',
  });
});

app.get('/gate/status', requireGateKey, (_req, res) => {
  console.log(`STATUS checked: ${gateState.status}`);

  if (gateState.status === 'idle') {
    return res.json({ status: 'idle' });
  }

  return res.json({
    status: gateState.status,
    requestedAt: gateState.requestedAt,
  });
});

app.post('/gate/ack', requireGateKey, (_req, res) => {
  gateState.status = 'idle';
  gateState.requestedAt = null;

  console.log('ACK received');

  return res.json({
    ok: true,
    status: 'idle',
  });
});

app.all('/mcp', async (req, res) => {
  try {
    const mcpServer = buildMcpServer();
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      mcpServer.close().catch(() => {});
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Gate server running on port ${port}`);
});
