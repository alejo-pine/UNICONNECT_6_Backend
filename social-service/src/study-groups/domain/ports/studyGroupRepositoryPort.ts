import { StudyGroup, StudyGroupWithSubject, GroupMember } from '../entities/studyGroup';

export interface StudyGroupRepositoryPort {
  create(input: {
    name: string;
    description: string;
    subjectId: string;
    creatorId: string;
  }): Promise<StudyGroup>;
  findByProfileId(profileId: string): Promise<StudyGroupWithSubject[]>;
  findAll(limit: number): Promise<StudyGroupWithSubject[]>;
  verifyEnrollment(profileId: string, subjectId: string): Promise<boolean>;
  findAvailableBySubject(subjectId: string, currentProfileId: string): Promise<StudyGroupWithSubject[]>;
  findById(groupId: string): Promise<StudyGroupWithSubject | null>;
  isMember(profileId: string, groupId: string): Promise<boolean>;
  addMember(profileId: string, groupId: string): Promise<void>;
  removeMember(profileId: string, groupId: string): Promise<void>;
  findMembers(groupId: string): Promise<GroupMember[]>;
}
