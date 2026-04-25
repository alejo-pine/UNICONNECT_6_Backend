export interface SubjectRepositoryPort {
  exists(subjectId: string): Promise<boolean>;
}
