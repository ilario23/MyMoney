/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url("VITE_SUPABASE_URL must be a valid URL")
    .min(1, "VITE_SUPABASE_URL is required"),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY is required"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => err.path.join("."))
        .join(", ");
      throw new Error(
        `❌ Missing or invalid environment variables: ${missingVars}\n\n` +
          "Please create a .env file with the following variables:\n" +
          "VITE_SUPABASE_URL=your_supabase_url\n" +
          "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n" +
          "See .env.example for reference."
      );
    }
    throw error;
  }
}

export const env = validateEnv();
