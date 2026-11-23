import PastClient, { PastError } from 'pastdotdev';
import { fileURLToPath } from 'node:url';

const PREFIX = '/api/memory';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_CONTENT_CHARS = 32000;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let client;

function getClient() {
  if (!process.env.PAST_API_KEY) {
    // `node server.js` and Vite do not both preload .env for us.
    try {
      process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
    } catch {
      // No .env file: the missing-key error below is the useful one.
    }
  }
  const apiKey = process.env.PAST_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, 'memory-not-configured', 'PAST_API_KEY is not set on the server.');
  }
  if (!client) client = new PastClient({ apiKey });
  return client;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'payload-too-large', 'Request body is too large.');
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid-json', 'Request body must be a JSON object.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'invalid-json', 'Request body must be a JSON object.');
  }
  return parsed;
}

function requireString(body, key, max) {
  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, 'invalid-request', `${key} must be a non-empty string.`);
  }
  if (value.length > max) {
    throw new HttpError(400, 'invalid-request', `${key} exceeds ${max} characters.`);
  }
  return value;
}

function optionalString(body, keys, max) {
  for (const key of keys) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.length === 0 || value.length > max) {
      throw new HttpError(400, 'invalid-request', `${key} must be a string of 1-${max} characters.`);
    }
  }
}

function optionalInt(body, key, min, max) {
  const value = body[key];
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, 'invalid-request', `${key} must be an integer between ${min} and ${max}.`);
  }
}

function optionalEnum(body, key, values) {
  const value = body[key];
  if (value === undefined) return;
  if (!values.includes(value)) {
    throw new HttpError(400, 'invalid-request', `${key} must be one of: ${values.join(', ')}.`);
  }
}

function isTimestamp(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function pick(body, keys) {
  const out = {};
  for (const key of keys) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

/**
 * Connect/Express middleware exposing a minimal, same-origin past.dev proxy.
 * The API key never leaves the server; browser callers only see the JSON results.
 */
export function createMemoryMiddleware() {
  return async function memoryMiddleware(req, res, next) {
    const pathname = String(req.url || '').split('?')[0];
    if (pathname !== PREFIX && !pathname.startsWith(`${PREFIX}/`)) {
      next();
      return;
    }

    try {
      const past = getClient();

      if (pathname === `${PREFIX}/ingest` && req.method === 'POST') {
        const body = await readJson(req);
        const payload = pick(body, [
          'id',
          'content',
          'label',
          'timestamp',
          'identity',
          'audience',
          'idempotencyKey',
        ]);
        requireString(payload, 'content', MAX_CONTENT_CHARS);
        optionalString(payload, ['id', 'label', 'identity', 'audience', 'idempotencyKey'], 256);
        if (payload.timestamp !== undefined && !isTimestamp(payload.timestamp)) {
          throw new HttpError(
            400,
            'invalid-request',
            'timestamp must be an ISO 8601 string with a timezone (e.g. 2026-02-03T09:00:00Z).'
          );
        }
        const receipt = await past.ingest(payload);
        sendJson(res, 202, receipt);
        return;
      }

      const ingestionMatch = pathname.match(/^\/api\/memory\/ingest\/([^/]+)$/);
      if (ingestionMatch && req.method === 'GET') {
        const send = await past.ingest(decodeURIComponent(ingestionMatch[1]));
        sendJson(res, 200, send);
        return;
      }

      if (pathname === `${PREFIX}/recall` && req.method === 'POST') {
        const body = await readJson(req);
        const query = requireString(body, 'query', 2000);
        const identity = requireString(body, 'identity', 256);
        const payload = {
          query,
          identity,
          ...pick(body, ['level', 'maxTokens', 'limit', 'sort', 'queryTimestamp', 'occurredFrom', 'occurredTo']),
        };
        optionalEnum(payload, 'level', ['low', 'medium', 'high']);
        optionalInt(payload, 'maxTokens', 1, 32000);
        optionalInt(payload, 'limit', 1, 100);
        optionalString(payload, ['sort', 'queryTimestamp', 'occurredFrom', 'occurredTo'], 64);
        const page = await past.recall(payload);
        sendJson(res, 200, page);
        return;
      }

      sendJson(res, 404, { error: { code: 'not-found', message: 'Unknown memory route.' } });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: { code: error.code, message: error.message } });
        return;
      }
      if (error instanceof PastError) {
        const code = error.body?.code ?? 'past-api-error';
        const message = error.body?.debugMessage ?? 'past.dev request failed.';
        sendJson(res, error.status ?? 502, { error: { code, message } });
        return;
      }
      console.error('[past.dev] memory request failed:', error?.name ?? 'Error');
      sendJson(res, 500, { error: { code: 'internal-error', message: 'Memory request failed.' } });
    }
  };
}
