export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface StudySession {
  id: string;
  groupId: string;
  creatorId: string;
  name: string;
  description: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  seriesId: string | null;
  recurrenceType: RecurrenceType;
  createdAt: string;
}

export interface CreateStudySessionInput {
  groupId: string;
  creatorId: string;
  name: string;
  description: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: string; // ISO string, required if recurrenceType !== 'none'
}

export interface UpdateStudySessionInput {
  name?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}
