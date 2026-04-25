import { ProfileSubjectRelation, Subject } from '../entities/profileSubject';

export interface ProfileSubjectsRepositoryPort {
  findSubjectsInfoByProfile(profileId: string): Promise<Subject[]>;
  addSubjectToProfile(profileId: string, subjectId: string): Promise<ProfileSubjectRelation>;
  removeSubjectFromProfile(profileId: string, subjectId: string): Promise<boolean>;
}
