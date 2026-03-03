// Tests: modules/listHighlights + modules/getHighlight
// Endpoints: GET /highlights, GET /highlights/:id

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

describe('listHighlights', () => {
  // Mirrors: modules/listHighlights/listHighlights.communication.iml.json
  // GET /highlights?limit=N&format=standard

  test('returns paginated response with data array and pagination', async () => {
    const { status, body } = await client.get('/highlights', { limit: 2, format: 'standard' });

    expect(status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('pagination');
    expect(typeof body.pagination.hasMore).toBe('boolean');
  });

  test('each highlight matches listHighlights interface', async () => {
    const { body } = await client.get('/highlights', { limit: 3, format: 'standard' });

    for (const highlight of body.data) {
      expectMatchesInterface(highlight, 'listHighlights');
    }
  });

  test('pagination cursor returns next page', async () => {
    const page1 = await client.get('/highlights', { limit: 2, format: 'standard' });

    if (!page1.body.pagination.hasMore) {
      console.warn('SKIPPED: Only one page of highlights available');
      return;
    }

    const page2 = await client.get('/highlights', {
      limit: 2,
      format: 'standard',
      after: page1.body.pagination.next,
    });

    expect(page2.status).toBe(200);
    expect(page2.body.data.length).toBeGreaterThan(0);
  });
});

describe('getHighlight', () => {
  // Mirrors: modules/getHighlight/getHighlight.communication.iml.json
  // GET /highlights/:highlightId

  test('returns full highlight matching interface', async () => {
    if (!fixtures.highlightId) {
      console.warn('SKIPPED: No highlights found');
      return;
    }

    const { status, body } = await client.get(`/highlights/${fixtures.highlightId}`);

    expect(status).toBe(200);
    expectMatchesInterface(body, 'getHighlight');
  });

  test('invalid highlight ID returns error', async () => {
    const { status } = await client.get('/highlights/nonexistent_highlight_xyz');

    expect(status).toBeGreaterThanOrEqual(400);
  });
});
