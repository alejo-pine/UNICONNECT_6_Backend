export interface SubjectSummary {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  program: string | null;
  createdAt: string;
}
