import { Request, Response } from 'express';
import { onboardingDependencies } from '../../dependencies';
import { HttpError } from '../../../utils/httpError';
import { OnboardingStepOneInput, OnboardingContactInput } from '../../domain/entities/onboarding';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const getProfileIdFromRequest = (req: AuthenticatedRequest): string => {
  const profileId = req.user?.id || (typeof req.params.profileId === 'string' ? req.params.profileId : undefined);
  if (!profileId) {
    throw new HttpError(401, 'ID de perfil requerido');
  }
  return profileId;
};

/**
 * Obtiene el estado actual del onboarding para un perfil
 */
export const getOnboardingStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = getProfileIdFromRequest(req);

  const result = await onboardingDependencies.getOnboardingStatusUseCase.execute(profileId);

  if (result.error) {
    throw new HttpError(result.statusCode, result.error);
  }

  res.status(result.statusCode).json({
    status: result.data,
  });
};

/**
 * Marca un nuevo perfil como "requiere onboarding"
 * Se ejecuta automáticamente cuando un usuario se autentica por primera vez
 */
export const markOnboardingRequired = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = getProfileIdFromRequest(req);

  const result = await onboardingDependencies.markNewProfileOnboardingRequiredUseCase.execute(profileId);

  if (result.error) {
    throw new HttpError(result.statusCode, result.error);
  }

  res.status(result.statusCode).json({
    message: 'Onboarding marcado como requerido',
    status: result.data,
  });
};

/**
 * Guarda la información del Paso 1: carrera, semestre y teléfono
 */
export const saveOnboardingStepOne = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('[saveOnboardingStepOne] Iniciando...');
    console.log('[saveOnboardingStepOne] req.user:', req.user);
    
    const profileId = getProfileIdFromRequest(req);
    console.log('[saveOnboardingStepOne] profileId:', profileId);
    
    // Aceptar tanto snake_case como camelCase del frontend
    const { career, semester } = req.body;
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    console.log('[saveOnboardingStepOne] body:', { career, semester, phoneNumber });

    // Validación básica
    if (!career || typeof career !== 'string' || !career.trim()) {
      console.log('[saveOnboardingStepOne] Error: Carrera inválida');
      throw new HttpError(400, 'Carrera es requerida');
    }
    if (!semester || typeof semester !== 'number' || semester < 1 || semester > 12) {
      console.log('[saveOnboardingStepOne] Error: Semestre inválido');
      throw new HttpError(400, 'Semestre debe ser un número entre 1 y 12');
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      console.log('[saveOnboardingStepOne] Error: Teléfono inválido');
      throw new HttpError(400, 'Número de teléfono es requerido');
    }

    const input = {
      career: career.trim(),
      semester,
      phoneNumber: phoneNumber.trim(),
    };
    console.log('[saveOnboardingStepOne] input validado:', input);

    console.log('[saveOnboardingStepOne] Ejecutando use case...');
    const result = await onboardingDependencies.saveOnboardingStepOneUseCase.execute(profileId, input);
    console.log('[saveOnboardingStepOne] result:', result);

    if (result.error) {
      console.log('[saveOnboardingStepOne] Error del use case:', result.error);
      throw new HttpError(result.statusCode, result.error);
    }

    console.log('[saveOnboardingStepOne] ✓ Enviando respuesta...');
    res.status(result.statusCode).json({
      message: 'Información del paso 1 guardada',
      data: result.data,
    });
  } catch (error) {
    console.error('[saveOnboardingStepOne] ✗ Excepción capturada:', error);
    throw error;
  }
};

/**
 * Guarda contacto del usuario (teléfono)
 */
export const saveOnboardingContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('[saveOnboardingContact] Iniciando...');
    
    const profileId = getProfileIdFromRequest(req);
    console.log('[saveOnboardingContact] profileId:', profileId);
    
    // Aceptar tanto snake_case como camelCase del frontend
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    console.log('[saveOnboardingContact] phoneNumber:', phoneNumber);

    // Validación básica
    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      console.log('[saveOnboardingContact] Error: Teléfono inválido');
      throw new HttpError(400, 'Número de teléfono es requerido');
    }

    const input = {
      phoneNumber: phoneNumber.trim(),
    };
    console.log('[saveOnboardingContact] input validado:', input);

    console.log('[saveOnboardingContact] Ejecutando use case...');
    const result = await onboardingDependencies.saveOnboardingContactUseCase.execute(profileId, input);
    console.log('[saveOnboardingContact] result:', result);

    if (result.error) {
      console.log('[saveOnboardingContact] Error del use case:', result.error);
      throw new HttpError(result.statusCode, result.error);
    }

    console.log('[saveOnboardingContact] ✓ Enviando respuesta...');
    res.status(result.statusCode).json({
      message: 'Información de contacto guardada',
      data: result.data,
    });
  } catch (error) {
    console.error('[saveOnboardingContact] ✗ Excepción capturada:', error);
    throw error;
  }
};

/**
 * Marca el onboarding como completado
 */
export const completeOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profileId = getProfileIdFromRequest(req);
  const { skipped } = req.body;

  const result = await onboardingDependencies.completeOnboardingUseCase.execute(
    profileId,
    Boolean(skipped)
  );

  if (result.error) {
    throw new HttpError(result.statusCode, result.error);
  }

  res.status(result.statusCode).json({
    message: 'Onboarding completado',
    status: result.data,
  });
};

/**
 * Obtiene listado de programas/carreras disponibles para onboarding
 */
export const getOnboardingPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[getOnboardingPrograms] Iniciando...');
    console.log('[getOnboardingPrograms] query:', req.query);
    
    const { search, limit } = req.query;
    const searchStr = typeof search === 'string' ? search : undefined;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 20;
    
    console.log('[getOnboardingPrograms] searchStr:', searchStr, 'limitNum:', limitNum);

    const result = await onboardingDependencies.getOnboardingProgramsUseCase.execute(searchStr, limitNum);
    console.log('[getOnboardingPrograms] result:', result);

    if (result.error) {
      console.log('[getOnboardingPrograms] Error:', result.error);
      throw new HttpError(result.statusCode, result.error);
    }

    console.log('[getOnboardingPrograms] ✓ Enviando respuesta con', (result.data as any)?.length || 0, 'programas');
    res.status(result.statusCode).json({
      programs: result.data,
    });
  } catch (error) {
    console.error('[getOnboardingPrograms] ✗ Excepción:', error);
    throw error;
  }
};
