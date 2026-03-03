// Mirrors general/base.iml.json: baseUrl, auth headers, error handling
const BASE_URL = 'https://api.hedy.bot';

class HedyApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async get(path, queryParams = {}) {
    const url = new URL(path, BASE_URL);
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
    return { status: response.status, body: await response.json() };
  }

  async post(path, body = {}) {
    const url = new URL(path, BASE_URL);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  async delete(path) {
    const url = new URL(path, BASE_URL);
    const response = await fetch(url.toString(), { method: 'DELETE', headers: this.headers });
    const contentType = response.headers.get('content-type') || '';
    return {
      status: response.status,
      body: contentType.includes('json') ? await response.json() : null,
    };
  }
}

module.exports = { HedyApiClient, BASE_URL };
