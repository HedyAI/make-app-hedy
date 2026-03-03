// Tests: connections/apiKey/apiKey.communication.iml.json
// Endpoint: GET https://api.hedy.bot/me

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');

let client;

beforeAll(() => {
  if (!process.env.HEDY_API_KEY) {
    throw new Error('HEDY_API_KEY not set. Copy .env.example to .env and add your key.');
  }
  client = new HedyApiClient(process.env.HEDY_API_KEY);
});

describe('Connection: apiKey', () => {
  test('valid API key returns 200 with email', async () => {
    const { status, body } = await client.get('/me');

    expect(status).toBe(200);
    expect(body).toHaveProperty('email');
    expect(typeof body.email).toBe('string');
  });

  test('invalid API key returns 401', async () => {
    const badClient = new HedyApiClient('invalid_key_xxx');
    const { status } = await badClient.get('/me');

    expect(status).toBe(401);
  });
});
