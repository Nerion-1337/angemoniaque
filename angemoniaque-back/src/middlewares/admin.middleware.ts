import { Context, Next } from 'hono';

export async function requireAdminRole(c: Context, next: Next) {
  const role = c.req.header('x-role');
  if (role !== 'admin') {
    return c.json({ error: 'Accès réservé aux administrateurs' }, 403);
  }
  await next();
}