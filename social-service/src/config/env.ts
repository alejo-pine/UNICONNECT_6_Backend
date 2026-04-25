import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly backendPublicUrl?: string;
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const isValidHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
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

  // PORT
  const portStr = process.env.PORT;
  let port = 3003;
  if (portStr) {
    const parsedPort = parseInt(portStr, 10);
    if (Number.isNaN(parsedPort) || parsedPort <= 0) {
      errors.push('PORT debe ser un número entero positivo');
    } else {
      port = parsedPort;
    }
  }

  // NODE_ENV
  const nodeEnvStr = process.env.NODE_ENV ?? 'development';
  const validNodeEnvs: ('development' | 'production' | 'test')[] = [
    'development',
    'production',
    'test',
  ];
  if (!validNodeEnvs.includes(nodeEnvStr as 'development' | 'production' | 'test')) {
    errors.push(`NODE_ENV debe ser uno de: ${validNodeEnvs.join(', ')}`);
  }

  // BACKEND_PUBLIC_URL (opcional)
  const backendPublicUrl = process.env.BACKEND_PUBLIC_URL?.trim();
  if (backendPublicUrl && !isValidHttpsUrl(backendPublicUrl)) {
    errors.push('BACKEND_PUBLIC_URL debe ser una URL HTTPS válida o estar vacío');
  }

  if (errors.length > 0) {
    console.error('❌ Variables de entorno inválidas:');
    errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
    supabaseJwtSecret: supabaseJwtSecret!,
    backendPublicUrl,
    port,
    nodeEnv: nodeEnvStr as 'development' | 'production' | 'test',
  };
};

export const env: Environment = parseEnv();
