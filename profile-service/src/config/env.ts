import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly supabaseAvatarsBucket: string;
  readonly backendPublicUrl?: string;
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const env: Environment = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
  supabaseAvatarsBucket: process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars',
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL?.trim(),
  port: parseInt(process.env.PORT ?? '3002', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
};

const validateEnvironment = (): void => {
  const errors: string[] = [];

  if (!env.supabaseUrl) {
    errors.push('SUPABASE_URL es requerido');
  }

  if (!env.supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY es requerido');
  }

  if (!env.supabaseJwtSecret) {
    errors.push('SUPABASE_JWT_SECRET es requerido para validar tokens');
  }

  if (errors.length > 0) {
    console.error('Errores de configuración:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
};

validateEnvironment();

export { env };
