// Tests: modules/listTopics + modules/getTopic + rpcs/listTopicsRpc
// Endpoints: GET /topics, GET /topics/:id

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

describe('listTopics', () => {
  // Mirrors: modules/listTopics/listTopics.communication.iml.json
  // GET /topics → { success, data: [...] }

  test('returns response with data array', async () => {
    const { status, body } = await client.get('/topics');

    expect(status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('each topic matches listTopics interface', async () => {
    const { body } = await client.get('/topics');

    if (body.data.length === 0) {
      console.warn('SKIPPED: No topics found in account');
      return;
    }

    for (const topic of body.data.slice(0, 5)) {
      expectMatchesInterface(topic, 'listTopics');
    }
  });
});

describe('getTopic', () => {
  // Mirrors: modules/getTopic/getTopic.communication.iml.json
  // GET /topics/:topicId → { success, data: {...} }

  test('returns full topic matching interface', async () => {
    if (!fixtures.topicId) {
      console.warn('SKIPPED: No topics found');
      return;
    }

    const { status, body } = await client.get(`/topics/${fixtures.topicId}`);

    expect(status).toBe(200);
    expect(body).toHaveProperty('data');
    expectMatchesInterface(body.data, 'getTopic');
  });

  test('invalid topic ID returns error', async () => {
    const { status } = await client.get('/topics/nonexistent_topic_xyz');

    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe('listTopicsRpc', () => {
  // Mirrors: rpcs/listTopicsRpc/listTopicsRpc.communication.iml.json
  // GET /topics → iterate body.data → { label: item.name, value: item.id }

  test('each topic has name and id for dropdown mapping', async () => {
    const { body } = await client.get('/topics');

    if (body.data.length === 0) {
      console.warn('SKIPPED: No topics found');
      return;
    }

    for (const topic of body.data) {
      expect(typeof topic.name).toBe('string');
      expect(topic.id).toBeTruthy();
    }
  });
});
