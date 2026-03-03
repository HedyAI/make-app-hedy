// Tests: webhooks/hedyEvents attach + detach lifecycle
// Endpoints: POST /webhooks, DELETE /webhooks/:id

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { HedyApiClient } = require('./helpers/api-client');

let client;

beforeAll(() => {
  client = new HedyApiClient(process.env.HEDY_API_KEY);
});

describe('Webhook lifecycle', () => {
  // Mirrors: webhooks/hedyEvents/hedyEvents.attach.iml.json (POST /webhooks)
  //          webhooks/hedyEvents/hedyEvents.detach.iml.json (DELETE /webhooks/:webhookId)
  // API returns: { success, data: { id, events, url, ... } }

  let createdWebhookId = null;

  test('attach: POST /webhooks creates webhook and returns id', async () => {
    const { status, body } = await client.post('/webhooks', {
      url: 'https://httpbin.org/post',
      events: ['session.ended'],
    });

    expect(status).toBeLessThan(300);
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('id');
    expect(typeof body.data.id).toBe('string');

    createdWebhookId = body.data.id;
  });

  test('detach: DELETE /webhooks/:id removes webhook', async () => {
    if (!createdWebhookId) {
      console.warn('SKIPPED: No webhook was created in attach test');
      return;
    }

    const { status } = await client.delete(`/webhooks/${createdWebhookId}`);

    expect(status).toBeLessThan(300);
    createdWebhookId = null;
  });

  test('attach with all event types succeeds', async () => {
    const { status, body } = await client.post('/webhooks', {
      url: 'https://httpbin.org/post',
      events: ['session.created', 'session.ended', 'highlight.created', 'todo.exported'],
    });

    expect(status).toBeLessThan(300);
    expect(body.data).toHaveProperty('id');

    // Cleanup
    if (body.data?.id) {
      await client.delete(`/webhooks/${body.data.id}`);
    }
  });
});
