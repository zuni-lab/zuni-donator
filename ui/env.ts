import { z } from 'zod';

const ProjectENVSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /**
   * Feature flags, comma separated
   */
  NEXT_PUBLIC_COINBASE_API_KEY: z.string().min(10),
  NEXT_PUBLIC_SMART_VAULT_ADDRESS: z.string().min(32),
  NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS: z
    .string()
    .min(42)
    .default('0x4200000000000000000000000000000000000020'),
});

/**
 * Return system ENV with parsed values
 */
export const ProjectENV = ProjectENVSchema.parse({
  NEXT_PUBLIC_COINBASE_API_KEY: process.env.NEXT_PUBLIC_COINBASE_API_KEY,
  NEXT_PUBLIC_SMART_VAULT_ADDRESS: process.env.NEXT_PUBLIC_SMART_VAULT_ADDRESS,
  NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS,
});
