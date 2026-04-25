import { Subject } from '../../../domain/entities/subject';

export interface SubjectApiResponse {
  id: string;
  name: string;
  code: string;
  program: string | null;
  created_at: string;
}

export const toSubjectApiResponse = (subject: Subject): SubjectApiResponse => ({
  id: subject.id,
  name: subject.name,
  code: subject.code,
  program: subject.program,
  created_at: subject.createdAt,
});
