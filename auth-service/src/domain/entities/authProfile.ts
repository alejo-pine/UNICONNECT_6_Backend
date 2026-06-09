export interface SyncedAuthProfile {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  role?: string;
}

export interface SyncAuthProfileInput {
  auth0Id: string;
  email: string;
  name: string;
}

export interface SyncAuthProfileData {
  profile: SyncedAuthProfile;
  created: boolean;
}
