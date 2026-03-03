// Tests: modules/listSessions + modules/getSession + rpcs/listSessionsRpc
// Endpoints: GET /sessions, GET /sessions/:id

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');
const { expectMatchesInterface } = require('./helpers/schema');
const { getFixtures } = require('./helpers/fixtures');

let client;
let fixtures;

beforeAll(async () => {
  client = new HedyApiClient(process.env.HEDY_API_KEY);
  fixtures = await getFixtures(client);
});

describe('listSessions', () => {
  // Mirrors: modules/listSessions/listSessions.communication.iml.json
  // GET /sessions?limit=N&format=standard

  test('returns paginated response with data array and pagination', async () => {
    const { status, body } = await client.get('/sessions', { limit: 2, format: 'standard' });

    expect(status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toHaveProperty('hasMore');
    expect(typeof body.pagination.hasMore).toBe('boolean');
  });

  test('each session matches listSessions interface', async () => {
    const { body } = await client.get('/sessions', { limit: 3, format: 'standard' });

    for (const session of body.data) {
      expectMatchesInterface(session, 'listSessions');
    }
  });

  test('limit parameter controls result count', async () => {
    const { body } = await client.get('/sessions', { limit: 1, format: 'standard' });

    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  test('pagination provides next cursor when hasMore is true', async () => {
    const { body } = await client.get('/sessions', { limit: 2, format: 'standard' });

    if (!body.pagination.hasMore) {
      console.warn('SKIPPED: Only one page of sessions available');
      return;
    }

    // When hasMore is true, next cursor must be present
    expect(body.pagination.next).toBeTruthy();
    expect(typeof body.pagination.next).toBe('string');

    // Verify cursor is accepted by the API (doesn't error)
    const page2 = await client.get('/sessions', {
      limit: 2,
      format: 'standard',
      after: body.pagination.next,
    });

    expect(page2.status).toBe(200);
    expect(Array.isArray(page2.body.data)).toBe(true);
  });
});

describe('getSession', () => {
  // Mirrors: modules/getSession/getSession.communication.iml.json
  // GET /sessions/:sessionId

  test('returns full session detail matching interface', async () => {
    if (!fixtures.sessionId) {
      console.warn('SKIPPED: No sessions found');
      return;
    }

    const { status, body } = await client.get(`/sessions/${fixtures.sessionId}`);

    expect(status).toBe(200);
    expectMatchesInterface(body, 'getSession');
  });

  test('invalid session ID returns error', async () => {
    const { status } = await client.get('/sessions/nonexistent_session_xyz');

    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe('listSessionsRpc', () => {
  // Mirrors: rpcs/listSessionsRpc/listSessionsRpc.communication.iml.json
  // GET /sessions?limit=50&format=standard → { label: item.title, value: item.sessionId }

  test('each session has title and sessionId for dropdown mapping', async () => {
    const { body } = await client.get('/sessions', { limit: 5, format: 'standard' });

    for (const session of body.data) {
      expect(typeof (session.title ?? '')).toBe('string');
      expect(session.sessionId).toBeTruthy();
    }
  });
});
