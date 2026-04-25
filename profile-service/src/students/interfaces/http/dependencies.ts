import { GetClassmatesBySubjectUseCase } from '../../application/use-cases/getClassmatesBySubjectUseCase';
import { SupabaseStudentRepository } from '../../infrastructure/supabaseStudentRepository';

const studentRepository = new SupabaseStudentRepository();

export const studentDependencies = {
  getClassmatesBySubjectUseCase: new GetClassmatesBySubjectUseCase(studentRepository),
};
