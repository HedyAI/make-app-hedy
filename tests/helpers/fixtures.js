let fixtures = null;

/**
 * Discovers real resource IDs from the Hedy API for use in get-by-ID tests.
 * Caches results so only one round of API calls is made per test run.
 */
async function getFixtures(client) {
  if (fixtures) return fixtures;

  const [sessions, topics, highlights] = await Promise.all([
    client.get('/sessions', { limit: 1, format: 'standard' }),
    client.get('/topics'),
    client.get('/highlights', { limit: 1, format: 'standard' }),
  ]);

  fixtures = {
    sessionId: sessions.body?.data?.[0]?.sessionId ?? null,
    topicId: topics.body?.data?.[0]?.id ?? null,
    highlightId: highlights.body?.data?.[0]?.highlightId ?? null,
  };

  return fixtures;
}

function resetFixtures() {
  fixtures = null;
}

module.exports = { getFixtures, resetFixtures };
