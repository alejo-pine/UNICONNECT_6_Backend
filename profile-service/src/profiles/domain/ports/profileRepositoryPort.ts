import { Profile, UploadAvatarInput } from '../entities/profile';
import { ProfileStatistics, ProfileBadge } from '../entities/profileDecorator';

export interface PublicProfileRecord {
  name: string;
  avatar_url: string | null;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  profile_subject: Array<{
    subject: Array<{ name: string }> | null;
  }> | null;
}

export interface ProfileRepositoryPort {
  findAll(): Promise<Profile[]>;
  findById(id: string): Promise<Profile | null>;
  findPublicById(id: string): Promise<PublicProfileRecord | null>;
  updateById(id: string, updates: Partial<Profile>): Promise<Profile | null>;
  uploadAvatar(profileId: string, file: UploadAvatarInput): Promise<string>;
  updateAvatarUrl(id: string, avatarUrl: string): Promise<Profile | null>;
  getProfileStatistics(profileId: string): Promise<ProfileStatistics>;
  getProfileBadges(profileId: string): Promise<ProfileBadge[]>;
}
