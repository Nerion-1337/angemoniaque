import { Context, Next } from 'hono';

export async function requireAccountAuth(c: Context, next: Next) {
  const accountId = c.req.header('x-account-id');
  if (!accountId) {
    return c.json({ error: 'En-tête x-account-id requis' }, 401);
  }
  c.set('accountId', accountId);
  await next();
}