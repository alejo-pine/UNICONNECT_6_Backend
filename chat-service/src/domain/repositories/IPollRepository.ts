// src/domain/repositories/IPollRepository.ts

import { Poll, PollWithResults } from '../entities/Poll';

export interface IPollRepository {
  /**
   * Crea una encuesta vinculada a un post del muro con sus respectivas opciones.
   */
  create(
    postId: string,
    question: string,
    options: string[],
    expiresAt: Date
  ): Promise<PollWithResults>;

  /**
   * Obtiene los resultados de una encuesta por su ID.
   */
  findWithResults(pollId: string, userId?: string): Promise<PollWithResults | null>;

  /**
   * Obtiene los resultados de una encuesta buscando por el ID del post asociado.
   */
  findWithResultsByPostId(postId: string, userId?: string): Promise<PollWithResults | null>;

  /**
   * Registra un voto para una opción en una encuesta.
   */
  registerVote(pollId: string, optionId: string, userId: string): Promise<void>;

  /**
   * Verifica si un usuario ya ha votado en una encuesta.
   */
  hasUserVoted(pollId: string, userId: string): Promise<boolean>;

  /**
   * Marca una encuesta como cerrada.
   */
  close(pollId: string): Promise<PollWithResults>;

  /**
   * Devuelve un listado de todas las encuestas que ya han expirado pero aún no se marcan como cerradas.
   */
  listExpiredNotClosed(): Promise<Poll[]>;
}
