import { ClassmateProfile } from '../entities/classmate';

export interface StudentRepositoryPort {
  verifyEnrollment(profileId: string, subjectId: string): Promise<boolean>;
  findClassmatesBySubject(subjectId: string, currentProfileId: string): Promise<ClassmateProfile[]>;
}
