import { Subject, SubjectSummary } from '../entities/subject';

export interface FindAllSubjectsOptions {
  search?: string;
  limit?: number;
  program?: string;
}

export interface SubjectReadRepositoryPort {
  findAll(options: FindAllSubjectsOptions): Promise<SubjectSummary[]>;
  findById(id: string): Promise<Subject | null>;
  findByProfileId(profileId: string): Promise<SubjectSummary[]>;
}
