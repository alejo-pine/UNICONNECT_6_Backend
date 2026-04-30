export interface SubjectSummary {
  id: string;
  name: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  creatorId: string;
  createdAt: string;
}

export interface StudyGroupWithSubject extends StudyGroup {
  subject?: SubjectSummary;
  member_count?: number;
}

export interface StudyGroupResponse extends StudyGroupWithSubject {
  isAdmin: boolean;
  isMember: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
}

export interface PendingAdminTransfer {
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface StudyGroupDetailResponse {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  pendingRequests: string[];
  subject?: SubjectSummary;
  pendingAdminTransfer?: PendingAdminTransfer;
}
