import { z } from 'zod';

const ProjectENVSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /**
   * Feature flags, comma separated
   */
  COINBASE_API_KEY: z.string().default(''),
});

/**
 * Return system ENV with parsed values
 */
export const ProjectENV = ProjectENVSchema.parse({
  COINBASE_API_KEY: process.env.COINBASE_API_KEY,
});