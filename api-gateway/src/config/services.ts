const validateUrl = (url: string): string => {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(`Invalid service URL: ${url}`);
  }
};

export const SERVICES = {
  AUTH_SERVICE: validateUrl(
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
  ),
  PROFILE_SERVICE: validateUrl(
    process.env.PROFILE_SERVICE_URL || 'http://localhost:3002'
  ),
  SOCIAL_SERVICE: validateUrl(
    process.env.SOCIAL_SERVICE_URL || 'http://localhost:3003'
  ),
};

export const SERVICE_ROUTES = {
  '/auth': SERVICES.AUTH_SERVICE,
  '/profiles': SERVICES.PROFILE_SERVICE,
  '/profile-subjects': SERVICES.PROFILE_SERVICE,
  '/groups': SERVICES.SOCIAL_SERVICE,
  '/events': SERVICES.SOCIAL_SERVICE,
};
