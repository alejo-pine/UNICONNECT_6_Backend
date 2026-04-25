import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingProgramOption } from '../../domain/entities/onboarding';
import { OnboardingRepositoryPort } from '../../domain/ports/onboardingRepositoryPort';

export class GetOnboardingProgramsUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(search?: string, limit = 20): Promise<ServiceResult<OnboardingProgramOption[]>> {
    try {
      console.log('[GetOnboardingProgramsUseCase] Iniciando...', { search, limit });
      
      const data = await this.onboardingRepository.findProgramsForOnboarding(search, limit);
      console.log('[GetOnboardingProgramsUseCase] ✓ Datos obtenidos:', data?.length || 0, 'programas');
      
      return {
        data,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching onboarding programs';
      console.error('[GetOnboardingProgramsUseCase] ✗ Error:', message);
      eventLogger.error('GetOnboardingProgramsUseCase.execute', message, { search, limit });
      return {
        data: null,
        error: 'Error fetching onboarding programs',
        statusCode: 500,
      };
    }
  }
}
