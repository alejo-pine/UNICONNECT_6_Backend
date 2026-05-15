import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly corsAllowedOrigins: string[];
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseEnv = (): Environment => {
  const errors: string[] = [];

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('SUPABASE_URL no está definida');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL debe empezar con https://');
  }

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY no está definida');
  } else if (supabaseServiceRoleKey.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY debe tener mínimo 20 caracteres');
  }

  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000';

  const port = parseInt(process.env.PORT ?? '3005', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT debe ser un número entre 1 y 65535');
  }

  const nodeEnv = (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV debe ser development, production o test');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
    corsAllowedOrigins: parseCsv(corsAllowedOrigins),
    port,
    nodeEnv,
  };
};

const env: Environment = parseEnv();

export { env };
export type { Environment };
