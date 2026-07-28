// Tests: regressions for the Make.com review findings (July 2026 round)
// Each test pins one reviewer finding to observed live-API behaviour so the
// corresponding app config can't silently drift back.

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');
const { loadInterface } = require('./helpers/schema');
const { getFixtures } = require('./helpers/fixtures');

let client;
let fixtures;

beforeAll(async () => {
  client = new HedyApiClient(process.env.HEDY_API_KEY);
  fixtures = await getFixtures(client);
});

const fieldNames = (moduleName) => loadInterface(moduleName).map((f) => f.name);
const fieldByName = (moduleName, name) =>
  loadInterface(moduleName).find((f) => f.name === name);

describe('Review item 2: dueDate is free-form text, not a date', () => {
  // The API documents dueDate as LLM-generated prose ('Tomorrow', 'End of week', '').
  // A `date` interface type would try to parse these and fail.

  test('listTodos declares dueDate as text', () => {
    expect(fieldByName('listTodos', 'dueDate').type).toBe('text');
  });

  test('getSession declares user_todos[].dueDate as text', () => {
    const todos = fieldByName('getSession', 'user_todos');
    const dueDate = todos.spec.find((f) => f.name === 'dueDate');
    expect(dueDate.type).toBe('text');
  });

  test('live /todos returns at least one dueDate that is not an ISO date', async () => {
    const { body } = await client.get('/todos');

    if (body.length === 0) {
      console.warn('SKIPPED: No todos found in account');
      return;
    }

    const dueDates = body.map((t) => t.dueDate).filter((d) => typeof d === 'string');
    const nonIso = dueDates.filter((d) => d !== '' && Number.isNaN(Date.parse(d)));

    // Every dueDate must be a string; at least one is expected to be unparseable prose.
    expect(dueDates.length).toBe(body.length);
    expect(nonIso.length).toBeGreaterThan(0);
  });
});

describe('Review item 3: /highlights list returns summary fields only', () => {
  const SUMMARY_FIELDS = ['highlightId', 'sessionId', 'timestamp', 'title'];

  test('listHighlights interface declares exactly the four summary fields', () => {
    expect(fieldNames('listHighlights').sort()).toEqual([...SUMMARY_FIELDS].sort());
  });

  test('live /highlights items expose no fields beyond the summary set', async () => {
    const { body } = await client.get('/highlights', { limit: 5 });

    for (const highlight of body.data) {
      expect(Object.keys(highlight).sort()).toEqual([...SUMMARY_FIELDS].sort());
    }
  });

  test('the full highlight fields are only available via /highlights/:id', async () => {
    if (!fixtures.highlightId) {
      console.warn('SKIPPED: No highlights found');
      return;
    }

    const { body } = await client.get(`/highlights/${fixtures.highlightId}`);

    for (const field of ['rawQuote', 'cleanedQuote', 'mainIdea', 'aiInsight', 'timeIndex']) {
      expect(body).toHaveProperty(field);
    }
  });
});

describe('Review item 4: embedded highlights use highlightId, not id', () => {
  test('getSession declares highlights[].highlightId and timeIndex', () => {
    const spec = fieldByName('getSession', 'highlights').spec.map((f) => f.name);

    expect(spec).toContain('highlightId');
    expect(spec).toContain('timeIndex');
    expect(spec).not.toContain('id');
  });

  test('live session detail embeds highlights keyed by highlightId', async () => {
    if (!fixtures.highlightId) {
      console.warn('SKIPPED: No highlights found');
      return;
    }

    const { body: highlight } = await client.get(`/highlights/${fixtures.highlightId}`);
    const { body: session } = await client.get(`/sessions/${highlight.sessionId}`);

    expect(Array.isArray(session.highlights)).toBe(true);
    expect(session.highlights.length).toBeGreaterThan(0);

    for (const embedded of session.highlights) {
      expect(embedded).toHaveProperty('highlightId');
      expect(embedded).toHaveProperty('timeIndex');
      expect(embedded).not.toHaveProperty('id');
    }
  });
});

describe('Review item 5: session topic is nested, session_type is returned', () => {
  test('listSessions declares a nested topic collection and session_type', () => {
    const names = fieldNames('listSessions');

    expect(names).toContain('topic');
    expect(names).toContain('session_type');
    expect(names).not.toContain('topicId');
    expect(names).not.toContain('topicName');
    expect(fieldByName('listSessions', 'topic').type).toBe('collection');
  });

  test('live /sessions never returns flat topicId/topicName', async () => {
    const { body } = await client.get('/sessions', { limit: 20 });

    for (const session of body.data) {
      expect(session).not.toHaveProperty('topicId');
      expect(session).not.toHaveProperty('topicName');

      if ('topic' in session && session.topic !== null) {
        expect(typeof session.topic).toBe('object');
        expect(session.topic).toHaveProperty('id');
      }
    }
  });
});

describe('Review item 6: page size must stay within the API maximum of 100', () => {
  test('live API rejects a page size above 100', async () => {
    const { status, body } = await client.get('/sessions', { limit: 101 });

    expect(status).toBe(400);
    expect(body.error.code).toBe('invalid_page_size');
  });

  test('live API accepts a page size of exactly 100', async () => {
    const { status } = await client.get('/sessions', { limit: 100 });

    expect(status).toBe(200);
  });

  test('search modules clamp qs.limit to 100 while response.limit caps the total', () => {
    const fs = require('fs');
    const path = require('path');

    for (const moduleName of ['listSessions', 'listHighlights']) {
      const file = path.resolve(
        __dirname,
        `../modules/${moduleName}/${moduleName}.communication.iml.json`
      );
      const comm = JSON.parse(fs.readFileSync(file, 'utf8'));

      // qs.limit must be clamped; response.limit must still honour the user's Limit.
      expect(comm.qs.limit).toContain('100');
      expect(comm.response.limit).toBe('{{ifempty(parameters.limit, 10)}}');
      expect(comm.qs).not.toHaveProperty('format');
    }
  });
});

describe('Review item 8: the connection test endpoint', () => {
  test('GET /me exists and returns an email for the connection label', async () => {
    const { status, body } = await client.get('/me');

    expect(status).toBe(200);
    expect(typeof body.email).toBe('string');
    expect(body.email).toContain('@');
  });
});

describe('Review item 11: EU region is a real, separate host', () => {
  test('the OpenAPI spec advertises both US and EU servers', async () => {
    const response = await fetch('https://api.hedy.bot/docs');
    const spec = await response.json();
    const urls = spec.servers.map((s) => s.url);

    expect(urls.some((u) => u.includes('api.hedy.bot'))).toBe(true);
    expect(urls.some((u) => u.includes('eu-api.hedy.bot'))).toBe(true);
  });
});

describe('Review item 16: the format parameter only accepts "zapier"', () => {
  test('the spec declares zapier as the sole accepted value', async () => {
    const response = await fetch('https://api.hedy.bot/docs');
    const spec = await response.json();

    expect(spec.components.parameters.formatParam.schema.enum).toEqual(['zapier']);
  });

  test('format=zapier drops the pagination wrapper, so search modules must not use it', async () => {
    const { body } = await client.get('/highlights', { limit: 1, format: 'zapier' });

    // A bare array: no body.data to iterate and no body.pagination to page through.
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('Review item 9: the webhook payload is flat, not wrapped in "data"', () => {
  // Verified against three real queued deliveries in the Make webhook queue for
  // hook 1958024 (session.ended, 2026-07-17 → 2026-07-21). All three had the
  // identical top-level key set below, with no `data` wrapper and no `timestamp`.
  // Note the webhook uses `sessionType` (camelCase) where the REST API returns
  // `session_type`, and it carries no topic fields at all.
  const OBSERVED_KEYS = [
    'event',
    'sessionId',
    'title',
    'startTime',
    'endTime',
    'duration',
    'sessionType',
    'transcript',
    'conversations',
    'structured_conversations',
    'meeting_minutes',
    'recap',
    'session_notes',
    'highlights',
  ];

  test('watchEvents interface matches the observed delivery exactly', () => {
    expect(fieldNames('watchEvents').sort()).toEqual([...OBSERVED_KEYS].sort());
  });

  test('no field is namespaced under data.', () => {
    for (const name of fieldNames('watchEvents')) {
      expect(name.startsWith('data.')).toBe(false);
    }
  });

  test('the disproven flat topic fields are gone', () => {
    // The review assumed the webhook carried flat topicId/topicName. Real
    // deliveries carry neither, so declaring them would resolve empty.
    const names = fieldNames('watchEvents');
    expect(names).not.toContain('topicId');
    expect(names).not.toContain('topicName');
  });

  test('structured_conversations timestamp is a number (epoch ms), not a date', () => {
    const spec = fieldByName('watchEvents', 'structured_conversations').spec;
    const timestamp = spec.find((f) => f.name === 'timestamp');
    expect(timestamp.type).toBe('number');
  });

  test('the webhook communication passes the body through unchanged', () => {
    const fs = require('fs');
    const path = require('path');
    const comm = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../webhooks/hedyEvents/hedyEvents.communication.iml.json'),
        'utf8'
      )
    );

    // Flat payload → the body IS the output; no unwrapping of body.data.
    expect(comm.output).toBe('{{body}}');
    expect(comm.condition).toBe('{{body.event}}');
  });
});

describe('Review item 12: interface labels use sentence case', () => {
  const MODULES = [
    'watchEvents',
    'getSession',
    'listSessions',
    'listHighlights',
    'getHighlight',
    'listTodos',
    'listTopics',
    'getTopic',
    'makeAnApiCall',
  ];

  // Words allowed to stay capitalised mid-label: acronyms and proper nouns.
  const ALLOWED_CAPS = new Set(['ID', 'AI', 'URL', 'JSON', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

  const collectLabels = (spec, out = []) => {
    for (const field of spec) {
      out.push(field.label);
      if (Array.isArray(field.spec)) collectLabels(field.spec, out);
    }
    return out;
  };

  test.each(MODULES)('%s labels are sentence case', (moduleName) => {
    const labels = collectLabels(loadInterface(moduleName)).filter(Boolean);
    const offenders = [];

    for (const label of labels) {
      const words = label.split(/[\s(]+/).slice(1);
      for (const word of words) {
        const bare = word.replace(/[^A-Za-z]/g, '');
        if (!bare) continue;
        if (ALLOWED_CAPS.has(bare)) continue;
        if (/^[A-Z]/.test(bare)) offenders.push(`${label} → "${word}"`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
