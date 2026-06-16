import { env } from '../../config/env';
import { eventLogger } from '../../utils/eventLogger';
import { SyncAuthProfileData, SyncAuthProfileInput } from '../../domain/entities/authProfile';
import { AuthRepositoryPort } from '../../domain/ports/authRepositoryPort';
import { ServiceResult } from '../dto/serviceResult';

export class SyncAuthProfileByIdentityUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  async execute(input: SyncAuthProfileInput): Promise<ServiceResult<SyncAuthProfileData>> {
    try {
      if (!input.email.endsWith(`@${env.allowedDomain}`)) {
        return {
          data: null,
          error: `Solo se permiten correos institucionales del dominio @${env.allowedDomain}`,
          statusCode: 403,
        };
      }

      let resolvedProfile = await this.authRepository.findProfileByAuth0Id(input.auth0Id);
      let created = false;

      if (!resolvedProfile) {
        resolvedProfile = await this.authRepository.findProfileByEmail(input.email);
      }

      if (resolvedProfile) {
        const updates: Partial<Pick<typeof resolvedProfile, 'auth0_id' | 'email' | 'name'>> = {};

        if (resolvedProfile.auth0_id !== input.auth0Id) {
          updates.auth0_id = input.auth0Id;
        }

        if (resolvedProfile.email !== input.email) {
          updates.email = input.email;
        }

        if (resolvedProfile.name !== input.name) {
          updates.name = input.name;
        }

        if (Object.keys(updates).length > 0) {
          resolvedProfile = await this.authRepository.updateAuthProfileById(resolvedProfile.id, updates);
        }
      } else {
        resolvedProfile = await this.authRepository.createAuthProfile(
          input.auth0Id,
          input.email,
          input.name
        );
        created = true;
      }

      return {
        data: {
          profile: resolvedProfile,
          created,
        },
        error: null,
        statusCode: created ? 201 : 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error syncing auth profile';
      eventLogger.error('SyncAuthProfileByIdentityUseCase.execute', message);
      return {
        data: null,
        error: 'Error syncing auth profile',
        statusCode: 500,
      };
    }
  }
}
