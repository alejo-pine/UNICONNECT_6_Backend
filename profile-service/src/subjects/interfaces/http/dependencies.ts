import { GetAllSubjectsUseCase } from '../../application/use-cases/getAllSubjectsUseCase';
import { GetSubjectByIdUseCase } from '../../application/use-cases/getSubjectByIdUseCase';
import { GetMySubjectsUseCase } from '../../application/use-cases/getMySubjectsUseCase';
import { SupabaseSubjectReadRepository } from '../../infrastructure/supabaseSubjectReadRepository';

const subjectRepository = new SupabaseSubjectReadRepository();

export const subjectDependencies = {
  getAllSubjectsUseCase: new GetAllSubjectsUseCase(subjectRepository),
  getSubjectByIdUseCase: new GetSubjectByIdUseCase(subjectRepository),
  getMySubjectsUseCase: new GetMySubjectsUseCase(subjectRepository),
};
