import { env } from '../../config/env';
import { supabase } from '../../config/supabaseClient';
import { Profile, UploadAvatarInput } from '../domain/entities/profile';
import { ProfileRepositoryPort, PublicProfileRecord } from '../domain/ports/profileRepositoryPort';
import { ProfileStatistics, ProfileBadge } from '../domain/entities/profileDecorator';

const TABLE = 'profile';
let avatarsBucketChecked = false;

const resolveFileExtensionFromMime = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();

  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/heic') return 'heic';
  if (normalized === 'image/heif') return 'heif';

  return 'jpg';
};

const isBucketNotFoundError = (message?: string): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('bucket not found') || normalized.includes('not found');
};

const ensureAvatarsBucket = async (): Promise<void> => {
  if (avatarsBucketChecked) {
    return;
  }

  const bucketName = env.supabaseAvatarsBucket;
  const { data, error } = await supabase.storage.getBucket(bucketName);

  if (!error && data) {
    avatarsBucketChecked = true;
    return;
  }

  if (error && !isBucketNotFoundError(error.message)) {
    throw new Error(error.message);
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  if (createError) {
    const alreadyExists = createError.message.toLowerCase().includes('already exists');
    if (!alreadyExists) {
      throw new Error(createError.message);
    }
  }

  avatarsBucketChecked = true;
};

export class SupabaseProfileRepository implements ProfileRepositoryPort {
  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Profile[];
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return data as Profile;
  }

  async findPublicById(id: string): Promise<PublicProfileRecord | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        `
      name,
      avatar_url,
      career,
      semester,
      phone_number,
      profile_subject (
        subject (
          name
        )
      )
    `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return data as PublicProfileRecord;
  }

  async updateById(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Profile;
  }

  async uploadAvatar(profileId: string, file: UploadAvatarInput): Promise<string> {
    await ensureAvatarsBucket();

    const extension = resolveFileExtensionFromMime(file.mimeType);
    const objectPath = `${profileId}/avatar_${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(env.supabaseAvatarsBucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimeType,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(env.supabaseAvatarsBucket).getPublicUrl(objectPath);

    if (!data.publicUrl) {
      throw new Error('No se pudo resolver la URL publica del avatar');
    }

    return data.publicUrl;
  }

  async updateAvatarUrl(id: string, avatarUrl: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ avatar_url: avatarUrl })
      .eq('id', id)
      .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Profile;
  }

  async getProfileStatistics(profileId: string): Promise<ProfileStatistics> {
    const { count: createdGroupsCount } = await supabase
      .from('study_group')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profileId);

    const { count: joinedGroupsCount } = await supabase
      .from('group_member')
      .select('group_id', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    const { count: messagesSentCount } = await supabase
      .from('direct_message')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', profileId);

    return {
      createdGroupsCount: createdGroupsCount ?? 0,
      joinedGroupsCount: joinedGroupsCount ?? 0,
      messagesSentCount: messagesSentCount ?? 0,
    };
  }

  async getProfileBadges(profileId: string): Promise<ProfileBadge[]> {
    // In a real system, these would be fetched from a 'profile_badge' table.
    // For this requirement, we'll return some mock badges based on system milestones.
    // E.g., if we could check stats we could unlock badges dynamically, or just return static for now.
    // Let's get the stats to simulate unlocked badges.
    const stats = await this.getProfileStatistics(profileId);
    const badges: ProfileBadge[] = [];

    if (stats.createdGroupsCount > 0) {
      badges.push({
        id: 'badge-creator-1',
        name: 'Iniciador',
        description: 'Creó su primer grupo de estudio',
        icon: '🚀',
        unlockedAt: new Date().toISOString()
      });
    }

    if (stats.createdGroupsCount >= 5) {
      badges.push({
        id: 'badge-creator-5',
        name: 'Monitor Universitario',
        description: 'Ha creado 5 grupos de estudio',
        icon: '👨‍🏫',
        unlockedAt: new Date().toISOString()
      });
    }

    if (stats.joinedGroupsCount >= 1) {
      badges.push({
        id: 'badge-explorer-1',
        name: 'Explorador Académico',
        description: 'Se unió a su primer grupo de estudio',
        icon: '🔍',
        unlockedAt: new Date().toISOString()
      });
    }

    if (stats.messagesSentCount >= 10) {
      badges.push({
        id: 'badge-chat-1',
        name: 'Sociable',
        description: 'Envió más de 10 mensajes',
        icon: '💬',
        unlockedAt: new Date().toISOString()
      });
    }

    return badges;
  }
}
