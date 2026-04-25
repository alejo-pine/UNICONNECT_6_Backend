import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import {
  getOnboardingStatus,
  markOnboardingRequired,
  saveOnboardingStepOne,
  saveOnboardingContact,
  completeOnboarding,
  getOnboardingPrograms,
} from './onboardingController';

const router: Router = Router();

/**
 * GET /onboarding/status
 * Obtiene el estado actual del onboarding para el perfil del usuario autenticado
 * Requiere autenticación - obtiene profileId del token JWT
 * Alias: GET /status/:profileId también funciona
 */
router.get('/status', asyncHandler(getOnboardingStatus));
router.get('/status/:profileId', asyncHandler(getOnboardingStatus));

/**
 * GET /onboarding/programs
 * Obtiene listado de programas/carreras disponibles
 * No requiere autenticación (datos públicos)
 */
router.get('/programs', asyncHandler(getOnboardingPrograms));

/**
 * POST /onboarding/mark
 * Marca un nuevo perfil como "requiere onboarding"
 * Se ejecuta cuando auth-service detecta nuevo usuario
 * Requiere autenticación
 */
router.post('/mark', asyncHandler(markOnboardingRequired));

/**
 * POST /onboarding/step-1
 * Guarda información del paso 1: carrera, semestre, teléfono
 * Requiere autenticación
 * Body: { career: string, semester: number, phoneNumber: string }
 * Alias: POST /step-one también funciona (para compatibilidad)
 */
router.post('/step-1', asyncHandler(saveOnboardingStepOne));
router.post('/step-one', asyncHandler(saveOnboardingStepOne));

/**
 * PATCH /onboarding/step-1/contact
 * Actualiza información de contacto (teléfono) del paso 1
 * Requiere autenticación
 * Body: { phoneNumber: string }
 * Alias: POST /contact también funciona (para compatibilidad)
 */
router.patch('/step-1/contact', asyncHandler(saveOnboardingContact));
router.post('/contact', asyncHandler(saveOnboardingContact));

/**
 * POST /onboarding/complete
 * Marca el onboarding como completado
 * Requiere autenticación
 * Body: { skipped?: boolean }
 */
router.post('/complete', asyncHandler(completeOnboarding));

export default router;
