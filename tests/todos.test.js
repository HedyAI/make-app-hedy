// Tests: modules/listTodos
// Endpoint: GET /todos (flat array, no pagination)

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');
const { expectMatchesInterface } = require('./helpers/schema');

let client;

beforeAll(() => {
  client = new HedyApiClient(process.env.HEDY_API_KEY);
});

describe('listTodos', () => {
  // Mirrors: modules/listTodos/listTodos.communication.iml.json
  // GET /todos → flat array (iterate: {{body}})

  test('returns a flat array (not paginated)', async () => {
    const { status, body } = await client.get('/todos');

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test('each todo matches listTodos interface', async () => {
    const { body } = await client.get('/todos');

    if (body.length === 0) {
      console.warn('SKIPPED: No todos found in account');
      return;
    }

    for (const todo of body.slice(0, 5)) {
      expectMatchesInterface(todo, 'listTodos');
    }
  });
});
