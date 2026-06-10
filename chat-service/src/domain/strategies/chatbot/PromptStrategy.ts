export interface PromptStrategy {
  /**
   * Genera el prompt del sistema correspondiente a la estrategia.
   * @returns El texto del system_prompt.
   */
  getSystemPrompt(): string;
}
