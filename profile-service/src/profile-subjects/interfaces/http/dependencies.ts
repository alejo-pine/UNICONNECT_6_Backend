import { AddSubjectToProfileUseCase } from '../../application/use-cases/addSubjectToProfileUseCase';
import { GetSubjectsInfoByProfileUseCase } from '../../application/use-cases/getSubjectsInfoByProfileUseCase';
import { RemoveSubjectFromProfileUseCase } from '../../application/use-cases/removeSubjectFromProfileUseCase';
import { SupabaseProfileSubjectsRepository } from '../../infrastructure/supabaseProfileSubjectsRepository';

const repository = new SupabaseProfileSubjectsRepository();

export const profileSubjectsDependencies = {
  getSubjectsInfoByProfileUseCase: new GetSubjectsInfoByProfileUseCase(repository),
  addSubjectToProfileUseCase: new AddSubjectToProfileUseCase(repository),
  removeSubjectFromProfileUseCase: new RemoveSubjectFromProfileUseCase(repository),
};
