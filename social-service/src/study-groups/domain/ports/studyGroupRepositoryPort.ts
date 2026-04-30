import { StudyGroup, StudyGroupDetailResponse, StudyGroupWithSubject, PendingAdminTransfer } from '../entities/studyGroup';

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
  findDetailById(groupId: string): Promise<StudyGroupDetailResponse | null>;
  isMember(profileId: string, groupId: string): Promise<boolean>;
  addMember(profileId: string, groupId: string): Promise<void>;
  removeMember(profileId: string, groupId: string): Promise<void>;
  userExists(profileId: string): Promise<boolean>;
  hasPendingRequest(profileId: string, groupId: string): Promise<boolean>;
  addPendingRequest(profileId: string, groupId: string): Promise<void>;
  removePendingRequest(profileId: string, groupId: string): Promise<void>;
  transferAdmin(groupId: string, newAdminProfileId: string): Promise<void>;
  getPendingAdminTransfer(groupId: string): Promise<PendingAdminTransfer | null>;
  setPendingAdminTransfer(groupId: string, fromUserId: string, toUserId: string): Promise<void>;
  clearPendingAdminTransfer(groupId: string): Promise<void>;
  acceptAdminTransfer(groupId: string): Promise<void>;
  countBySubject(subjectId: string): Promise<number>;
}
