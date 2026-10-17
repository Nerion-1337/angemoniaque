import { describe, it, expect } from 'vitest';
import { app } from '../../index.js';

describe('Intégration API Hono & OpenAPI', () => {
  it('expose la spécification OpenAPI 3.1 sur /api/v1/openapi.json', async () => {
    const res = await app.request('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toContain('Angemoniaque');
  });
});