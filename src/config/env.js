import { z } from "zod";
import "dotenv/config";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3333),

  API_TOKEN: z.string().min(1, "API_TOKEN é obrigatório"),
  QR_ACCESS_TOKEN: z.string().min(1, "QR_ACCESS_TOKEN é obrigatório"),

  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL válida"),

  MAX_RETRIES: z.coerce.number().default(5),
  RECONNECT_INTERVAL_MS: z.coerce.number().default(5000),
  SESSIONS_DIR: z.string().default("./sessions"),

  WEBHOOK_URL: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v))
    .pipe(z.string().url().optional())
    .optional(),
  WEBHOOK_MAX_RETRIES: z.coerce.number().default(3),
  WEBHOOK_RETRY_DELAY_MS: z.coerce.number().default(1000),

  TELEGRAM_TOKEN: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v))
    .optional(),
  TELEGRAM_CHAT_ID: z
    .string()
    .transform((v) => (v.trim() === "" ? undefined : v))
    .optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.errors
    .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
    .join("\n");

  console.error("[CONFIG] Variáveis de ambiente inválidas:\n" + errors);
  process.exit(1);
}

export const env = parsed.data;
