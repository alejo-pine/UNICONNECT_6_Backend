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
}

export interface StudyGroupResponse extends StudyGroupWithSubject {
  isAdmin: boolean;
  isMember: boolean;
}
