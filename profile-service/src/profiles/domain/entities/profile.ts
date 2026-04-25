export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  created_at: string;
}

export interface PublicProfile {
  full_name: string;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  avatar_url: string | null;
  subjects: string[];
}

export interface UploadAvatarInput {
  buffer: Buffer;
  mimeType: string;
}
