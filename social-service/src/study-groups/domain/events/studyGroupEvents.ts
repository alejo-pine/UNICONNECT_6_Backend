import { IObserver as SharedIObserver, ISubject as SharedISubject } from '../../../shared/domain/observer/observer';

export enum StudyGroupEventType {
  SOLICITUD_INGRESO = 'SOLICITUD_INGRESO',
  MIEMBRO_ACEPTADO = 'MIEMBRO_ACEPTADO',
  MIEMBRO_RECHAZADO = 'MIEMBRO_RECHAZADO',
  TRANSFERENCIA_ADMIN = 'TRANSFERENCIA_ADMIN',
}

export interface StudyGroupEvent {
  type: StudyGroupEventType;
  groupId: string;
  actorUserId: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
}

export type IObserver<TEvent = StudyGroupEvent> = SharedIObserver<TEvent>;
export type ISubject<TEvent = StudyGroupEvent> = SharedISubject<TEvent>;
