import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly allowedDomain: string;
  readonly backendPublicUrl?: string;
  readonly corsAllowedOrigins: string[];
  readonly auth0Domain?: string;
  readonly auth0Issuer?: string;
  readonly auth0Audience?: string;
  readonly auth0AllowedRedirectUris: string[];
  readonly requireAuthSyncToken: boolean;
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isValidHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidHttpOrHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return defaultValue;
};

const parseEnv = (): Environment => {
  const errors: string[] = [];

  // SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('SUPABASE_URL no está definida');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL debe empezar con https://');
  }

  // SUPABASE_SERVICE_ROLE_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY no está definida');
  } else if (supabaseServiceRoleKey.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY debe tener mínimo 20 caracteres');
  }

  // SUPABASE_JWT_SECRET
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!supabaseJwtSecret) {
    errors.push('SUPABASE_JWT_SECRET no está definida');
  } else if (supabaseJwtSecret.length < 20) {
    errors.push('SUPABASE_JWT_SECRET debe tener mínimo 20 caracteres');
  }

  // ALLOWED_DOMAIN
  const allowedDomain = process.env.ALLOWED_DOMAIN;
  if (!allowedDomain) {
    errors.push('ALLOWED_DOMAIN no está definida');
  }

  // CORS_ALLOWED_ORIGINS
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3001';

  // BACKEND_PUBLIC_URL (opcional)
  const backendPublicUrl = process.env.BACKEND_PUBLIC_URL?.trim();
  if (backendPublicUrl && !isValidHttpOrHttpsUrl(backendPublicUrl)) {
    errors.push('BACKEND_PUBLIC_URL debe ser una URL válida');
  }

  // AUTH0_DOMAIN (opcional)
  const auth0Domain = process.env.AUTH0_DOMAIN?.trim();

  // AUTH0_ISSUER (opcional)
  const auth0Issuer = process.env.AUTH0_ISSUER?.trim();
  if (auth0Issuer && !isValidHttpsUrl(auth0Issuer)) {
    errors.push('AUTH0_ISSUER debe ser una URL HTTPS válida');
  }

  // AUTH0_AUDIENCE (opcional)
  const auth0Audience = process.env.AUTH0_AUDIENCE?.trim();

  // AUTH0_ALLOWED_REDIRECT_URIS (opcional)
  const auth0AllowedRedirectUris = parseCsv(process.env.AUTH0_ALLOWED_REDIRECT_URIS ?? '');

  // REQUIRE_AUTH_SYNC_TOKEN (opcional)
  const requireAuthSyncToken = parseBoolean(process.env.REQUIRE_AUTH_SYNC_TOKEN, false);

  // PORT
  const port = parseInt(process.env.PORT ?? '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT debe ser un número entre 1 y 65535');
  }

  // NODE_ENV
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
    supabaseJwtSecret: supabaseJwtSecret!,
    allowedDomain: allowedDomain!,
    backendPublicUrl,
    corsAllowedOrigins: parseCsv(corsAllowedOrigins),
    auth0Domain,
    auth0Issuer,
    auth0Audience,
    auth0AllowedRedirectUris,
    requireAuthSyncToken,
    port,
    nodeEnv,
  };
};

const env: Environment = parseEnv();

export { env };
export type { Environment };
