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

export interface IObserver<TEvent = StudyGroupEvent> {
  update(event: TEvent): void | Promise<void>;
}

export interface ISubject<TEvent = StudyGroupEvent> {
  subscribe(observer: IObserver<TEvent>): void;
  unsubscribe(observer: IObserver<TEvent>): void;
  notify(event: TEvent): void | Promise<void>;
}
