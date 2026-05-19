import { StudySession } from '../entities/studySession';

export interface StudySessionRepositoryPort {
  createMany(sessions: Omit<StudySession, 'id' | 'createdAt'>[]): Promise<StudySession[]>;
  findByGroupId(groupId: string): Promise<StudySession[]>;
  findById(sessionId: string): Promise<StudySession | null>;
  findUpcomingSessions(minutesFromNow: number): Promise<StudySession[]>;
  updateSession(sessionId: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt'>>): Promise<StudySession>;
  updateSeriesFrom(seriesId: string, fromDate: string, updates: Partial<Omit<StudySession, 'id' | 'createdAt'>>): Promise<StudySession[]>;
  deleteSession(sessionId: string): Promise<void>;
}
