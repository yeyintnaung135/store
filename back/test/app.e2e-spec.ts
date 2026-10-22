import request from 'supertest';
import { startTestServer } from './start-test-server.js';

describe('App (e2e)', () => {
  let baseUrl: string;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    ({ baseUrl, stop } = await startTestServer());
  });

  afterAll(async () => {
    await stop();
  });

  it('GET / returns the greeting from the running server', async () => {
    await request(baseUrl).get('/').expect(200).expect('Hello World!');
  });

  it('GET /health returns ok from the running server', async () => {
    await request(baseUrl).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('GET /docs-json returns the OpenAPI document', async () => {
    const response = await request(baseUrl).get('/docs-json').expect(200);
    expect(response.body.info.title).toBe('Store API');
  });
});
