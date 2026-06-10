import { PromptStrategy } from './PromptStrategy';
import { EstudiantePromptStrategy } from './EstudiantePromptStrategy';
import { AdminPromptStrategy } from './AdminPromptStrategy';
import { RoleNotSupportedError } from './errors/RoleNotSupportedError';

export class PromptStrategyContext {
  private static strategies: Map<string, PromptStrategy> = new Map([
    ['student', new EstudiantePromptStrategy()],
    ['super_admin', new AdminPromptStrategy()],
  ]);

  /**
   * Permite registrar nuevas estrategias dinámicamente sin modificar esta clase,
   * facilitando la extensibilidad.
   */
  static registerStrategy(role: string, strategy: PromptStrategy): void {
    this.strategies.set(role.toLowerCase().trim(), strategy);
  }

  static getStrategy(role: string): PromptStrategy {
    const normalizedRole = role.toLowerCase().trim();
    const strategy = this.strategies.get(normalizedRole);

    if (!strategy) {
      throw new RoleNotSupportedError(`La estrategia para el rol '${role}' no está registrada en PromptStrategyContext.`);
    }

    return strategy;
  }
}
