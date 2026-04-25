export interface CreateStudyGroupCommand {
  name: string;
  description: string;
  subjectId: string;
  creatorId: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}
