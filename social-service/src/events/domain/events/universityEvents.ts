import { IObserver as SharedIObserver, ISubject as SharedISubject } from '../../../shared/domain/observer/observer';

export enum UniversityEventType {
  NUEVO_EVENTO = 'NUEVO_EVENTO'
}

export interface UniversityEvent {
  type: UniversityEventType;
  category: string;
  eventId: string;
  title: string;
}

export type IUniversityObserver = SharedIObserver<UniversityEvent>;
export type IUniversitySubject = SharedISubject<UniversityEvent>;
