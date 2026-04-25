import { createPublicKey, KeyObject } from 'crypto';
import { env } from '../config/env';

const keyCache = new Map<string, KeyObject>();

interface JWKSet {
  keys: (JsonWebKey & { kid?: string })[];
}

export const initializeJWKS = async (): Promise<void> => {
  const url = `${env.supabaseUrl}/auth/v1/.well-known/jwks.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo obtener JWKS de Supabase: ${response.status} ${response.statusText}`);
  }

  const jwks = (await response.json()) as JWKSet;

  keyCache.clear();
  for (const jwk of jwks.keys) {
    const kid = jwk.kid ?? 'default';
    const key = createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' });
    keyCache.set(kid, key);
  }
};

export const getPublicKeyByKid = (kid: string): KeyObject | undefined => {
  if (keyCache.has(kid)) return keyCache.get(kid);
  // Fallback: primera clave disponible
  const first = keyCache.values().next();
  return first.done ? undefined : first.value as KeyObject;
};
