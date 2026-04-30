import { CreateStudyGroupUseCase } from '../../application/use-cases/createStudyGroupUseCase';
import { GetAvailableStudyGroupsBySubjectUseCase } from '../../application/use-cases/getAvailableStudyGroupsBySubjectUseCase';
import { GetAllStudyGroupsUseCase } from '../../application/use-cases/getAllStudyGroupsUseCase';
import { GetMyStudyGroupsUseCase } from '../../application/use-cases/getMyStudyGroupsUseCase';
import { JoinStudyGroupUseCase } from '../../application/use-cases/joinStudyGroupUseCase';
import { LeaveStudyGroupUseCase } from '../../application/use-cases/leaveStudyGroupUseCase';
import { GetStudyGroupMembersUseCase } from '../../application/use-cases/getStudyGroupMembers';
import { SupabaseStudyGroupRepository } from '../../infrastructure/supabaseStudyGroupRepository';
import { SupabaseSubjectRepository } from '../../infrastructure/supabaseSubjectRepository';

const studyGroupRepository = new SupabaseStudyGroupRepository();
const subjectRepository = new SupabaseSubjectRepository();

export const studyGroupDependencies = {
  createStudyGroupUseCase: new CreateStudyGroupUseCase(studyGroupRepository, subjectRepository),
  getMyStudyGroupsUseCase: new GetMyStudyGroupsUseCase(studyGroupRepository),
  getAllStudyGroupsUseCase: new GetAllStudyGroupsUseCase(studyGroupRepository),
  getAvailableStudyGroupsBySubjectUseCase: new GetAvailableStudyGroupsBySubjectUseCase(
    studyGroupRepository
  ),
  joinStudyGroupUseCase: new JoinStudyGroupUseCase(studyGroupRepository),
  leaveStudyGroupUseCase: new LeaveStudyGroupUseCase(studyGroupRepository),
  getStudyGroupMembersUseCase: new GetStudyGroupMembersUseCase(studyGroupRepository),
};
