export interface Subject {
  id: string;
  name: string;
  code: string;
  program: string | null;
  created_at: string;
}

export interface ProfileSubjectRelation {
  profile_id: string;
  subject_id: string;
}
