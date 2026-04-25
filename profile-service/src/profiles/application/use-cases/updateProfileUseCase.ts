import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { Profile } from '../../domain/entities/profile';
import { ProfileRepositoryPort } from '../../domain/ports/profileRepositoryPort';

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async execute(id: string, profileData: Partial<Profile>): Promise<ServiceResult<Profile>> {
    try {
      const { created_at, ...dataToUpdate } = profileData;

      const updatedData = await this.profileRepository.updateById(id, dataToUpdate);

      if (!updatedData) {
        return {
          data: null,
          error: 'No se encontró el perfil para actualizar',
          statusCode: 404,
        };
      }

      return {
        data: updatedData,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al actualizar';
      eventLogger.error('UpdateProfileUseCase.execute', message, { id });

      return {
        data: null,
        error: 'Error interno del servidor al intentar actualizar el perfil',
        statusCode: 500,
      };
    }
  }
}
