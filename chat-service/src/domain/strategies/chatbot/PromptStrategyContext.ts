import { PromptStrategy } from './PromptStrategy';
import { EstudiantePromptStrategy } from './EstudiantePromptStrategy';
import { AdminPromptStrategy } from './AdminPromptStrategy';

export class PromptStrategyContext {
  static getStrategy(role: string): PromptStrategy {
    // Para roles que no sean student o super_admin, fallaremos por defecto a estudiante 
    // o lanzaremos un error. Según la HU, solo manejamos 'student' y 'super_admin' por ahora.
    // También es buena idea sanitizar a lowercase por seguridad.
    const normalizedRole = role.toLowerCase().trim();

    if (normalizedRole === 'super_admin') {
      return new AdminPromptStrategy();
    }

    // Default: 'student' (o cualquier otro rol recaerá en las restricciones de estudiante por seguridad)
    return new EstudiantePromptStrategy();
  }
}
