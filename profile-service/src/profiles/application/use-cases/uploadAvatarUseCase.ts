import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';
import { UploadAvatarInput } from '../../domain/entities/profile';

const ALLOWED_AVATAR_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export class UploadAvatarUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(
    profileId: string,
    authenticatedProfileId: string,
    file: UploadAvatarInput
  ): Promise<ServiceResult<{ url: string }>> {
    try {
      if (profileId !== authenticatedProfileId) {
        return {
          data: null,
          error: 'No autorizado para actualizar este avatar',
          statusCode: 403,
        };
      }

      const normalizedMimeType = file.mimeType.toLowerCase();
      if (!ALLOWED_AVATAR_MIME_TYPES.has(normalizedMimeType)) {
        return {
          data: null,
          error: 'Formato de imagen no soportado',
          statusCode: 400,
        };
      }

      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        return {
          data: null,
          error: 'Profile not found',
          statusCode: 404,
        };
      }

      const publicUrl = await this.profileRepository.uploadAvatar(profileId, {
        buffer: file.buffer,
        mimeType: normalizedMimeType,
      });

      await this.profileRepository.updateAvatarUrl(profileId, publicUrl);

      return {
        data: { url: publicUrl },
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error uploading avatar';
      eventLogger.error('UploadAvatarUseCase.execute', message, { profileId });

      return {
        data: null,
        error: 'Error interno del servidor al subir avatar',
        statusCode: 500,
      };
    }
  }
}
