import { z } from 'zod';

const ProjectENVSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /**
   * Feature flags, comma separated
   */
  NEXT_PUBLIC_SMART_VAULT_ADDRESS: z.string().startsWith('0x').length(42),
  NEXT_PUBLIC_EAS_ADDRESS: z.string().startsWith('0x').length(42),
  NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS: z.string().startsWith('0x').length(42),
  NEXT_PUBLIC_VAULT_SCHEMA_UUID: z.string().length(66),
  NEXT_PUBLIC_WALLET_CONNECT_ENV_ID: z.string(),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string(),
});

/**
 * Return system ENV with parsed values
 */
export const ProjectENV = ProjectENVSchema.parse({
  NEXT_PUBLIC_SMART_VAULT_ADDRESS: process.env.NEXT_PUBLIC_SMART_VAULT_ADDRESS,
  NEXT_PUBLIC_EAS_ADDRESS: process.env.NEXT_PUBLIC_EAS_ADDRESS,
  NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_SCHEMA_REGISTRY_CONTRACT_ADDRESS,
  NEXT_PUBLIC_VAULT_SCHEMA_UUID: process.env.NEXT_PUBLIC_VAULT_SCHEMA_UUID,
  NEXT_PUBLIC_WALLET_CONNECT_ENV_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_ENV_ID,
  NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
});
