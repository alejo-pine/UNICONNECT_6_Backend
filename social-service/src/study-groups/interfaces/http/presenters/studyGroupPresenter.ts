import { StudyGroupResponse } from '../../../domain/entities/studyGroup';

interface StudyGroupApiResponse {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  creator_id: string;
  created_at: string;
  subject?: {
    id: string;
    name: string;
  };
  is_admin: boolean;
  is_member: boolean;
  member_count: number;
}

export const toStudyGroupApiResponse = (input: StudyGroupResponse): StudyGroupApiResponse => ({
  id: input.id,
  name: input.name,
  description: input.description,
  subject_id: input.subjectId,
  creator_id: input.creatorId,
  created_at: input.createdAt,
  subject: input.subject,
  is_admin: input.isAdmin,
  is_member: input.isMember,
  member_count: input.member_count ?? 0,
});

export const toStudyGroupApiResponseList = (inputs: StudyGroupResponse[]): StudyGroupApiResponse[] =>
  inputs.map(toStudyGroupApiResponse);
