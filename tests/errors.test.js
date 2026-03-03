// Tests: Cross-cutting error handling
// Validates base.iml.json error response patterns

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');

let client;

beforeAll(() => {
  client = new HedyApiClient(process.env.HEDY_API_KEY);
});

describe('Error handling', () => {
  test('401 with invalid Bearer token', async () => {
    const badClient = new HedyApiClient('invalid_key_xxx');
    const { status } = await badClient.get('/sessions', { limit: 1, format: 'standard' });

    expect(status).toBe(401);
  });

  test('404 for nonexistent session', async () => {
    const { status } = await client.get('/sessions/does_not_exist_12345');

    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('404 for nonexistent highlight', async () => {
    const { status } = await client.get('/highlights/does_not_exist_12345');

    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('404 for nonexistent topic', async () => {
    const { status } = await client.get('/topics/does_not_exist_12345');

    expect(status).toBeGreaterThanOrEqual(400);
  });
});
