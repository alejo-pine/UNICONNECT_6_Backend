import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingStatus } from '../../domain/entities/onboarding';
import { OnboardingRepositoryPort, OnboardingStateRecord } from '../../domain/ports/onboardingRepositoryPort';
import { ProfileRepositoryPort } from '../../../profiles/domain/ports/profileRepositoryPort';

const toOnboardingStatus = (state: OnboardingStateRecord): OnboardingStatus => ({
  needsOnboarding: state.onboarding_required,
  isCompleted: !state.onboarding_required,
  completedAt: state.onboarding_completed_at,
  skippedAt: state.onboarding_skipped_at,
});

export class CompleteOnboardingUseCase {
  constructor(
    private readonly onboardingRepository: OnboardingRepositoryPort,
    private readonly profileRepository: ProfileRepositoryPort
  ) {}

  async execute(profileId: string, skipped: boolean): Promise<ServiceResult<OnboardingStatus>> {
    try {
      const state = await this.onboardingRepository.completeOnboardingForProfile(profileId, skipped);
      
      // Si el onboarding fue completado con éxito (no fue saltado), enviamos el webhook
      if (!skipped) {
        this.profileRepository.findById(profileId).then(profile => {
          if (profile && profile.email) {
            // Se envía de forma asíncrona para no bloquear la respuesta
            fetch('https://juanfe044.app.n8n.cloud/webhook/usuario-verificado', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'usuario.verificado',
                user: {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email
                }
              })
            }).catch(e => console.error('[CompleteOnboardingUseCase] Error enviando webhook n8n:', e));
          }
        }).catch(e => console.error('[CompleteOnboardingUseCase] Error consultando perfil:', e));
      }

      return {
        data: toOnboardingStatus(state),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error completing onboarding';
      eventLogger.error('CompleteOnboardingUseCase.execute', message, { profileId, skipped });
      return {
        data: null,
        error: 'Error completing onboarding',
        statusCode: 500,
      };
    }
  }
}
