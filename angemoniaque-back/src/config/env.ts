import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://angemoniaque:secret_password@localhost:5432/angemoniaque'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('angemoniaque_jwt_secret_2026'),
});

export const env = EnvSchema.parse(process.env);