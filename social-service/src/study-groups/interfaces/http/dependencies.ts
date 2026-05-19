import { AcceptStudyGroupRequestUseCase } from '../../application/use-cases/acceptStudyGroupRequestUseCase';
import { CreateStudyGroupUseCase } from '../../application/use-cases/createStudyGroupUseCase';
import { GetAvailableStudyGroupsBySubjectUseCase } from '../../application/use-cases/getAvailableStudyGroupsBySubjectUseCase';
import { GetAllStudyGroupsUseCase } from '../../application/use-cases/getAllStudyGroupsUseCase';
import { GetMyStudyGroupsUseCase } from '../../application/use-cases/getMyStudyGroupsUseCase';
import { GetStudyGroupDetailUseCase } from '../../application/use-cases/getStudyGroupDetailUseCase';
import { JoinStudyGroupUseCase } from '../../application/use-cases/joinStudyGroupUseCase';
import { LeaveStudyGroupUseCase } from '../../application/use-cases/leaveStudyGroupUseCase';
import { GetStudyGroupMembersUseCase } from '../../application/use-cases/getStudyGroupMembers';
import { InitiateAdminTransferUseCase } from '../../application/use-cases/initiateAdminTransferUseCase';
import { RejectStudyGroupRequestUseCase } from '../../application/use-cases/rejectStudyGroupRequestUseCase';
import { RespondAdminTransferUseCase } from '../../application/use-cases/respondAdminTransferUseCase';
import { CreateStudySessionUseCase } from '../../application/use-cases/createStudySessionUseCase';
import { UpdateStudySessionUseCase } from '../../application/use-cases/updateStudySessionUseCase';
import { GetStudySessionsUseCase } from '../../application/use-cases/getStudySessionsUseCase';
import { SupabaseStudyGroupRepository } from '../../infrastructure/supabaseStudyGroupRepository';
import { SupabaseSubjectRepository } from '../../infrastructure/supabaseSubjectRepository';
import { SupabaseStudySessionRepository } from '../../infrastructure/supabaseStudySessionRepository';
import { StudySessionCronNotifier } from '../../infrastructure/StudySessionCronNotifier';

export const studyGroupRepository = new SupabaseStudyGroupRepository();
const subjectRepository = new SupabaseSubjectRepository();
export const studySessionRepository = new SupabaseStudySessionRepository();

export const studyGroupDependencies = {
  createStudyGroupUseCase: new CreateStudyGroupUseCase(studyGroupRepository, subjectRepository),
  getMyStudyGroupsUseCase: new GetMyStudyGroupsUseCase(studyGroupRepository),
  getAllStudyGroupsUseCase: new GetAllStudyGroupsUseCase(studyGroupRepository),
  getStudyGroupDetailUseCase: new GetStudyGroupDetailUseCase(studyGroupRepository),
  getAvailableStudyGroupsBySubjectUseCase: new GetAvailableStudyGroupsBySubjectUseCase(
    studyGroupRepository
  ),
  joinStudyGroupUseCase: new JoinStudyGroupUseCase(studyGroupRepository),
  acceptStudyGroupRequestUseCase: new AcceptStudyGroupRequestUseCase(studyGroupRepository),
  rejectStudyGroupRequestUseCase: new RejectStudyGroupRequestUseCase(studyGroupRepository),
  initiateAdminTransferUseCase: new InitiateAdminTransferUseCase(studyGroupRepository),
  respondAdminTransferUseCase: new RespondAdminTransferUseCase(studyGroupRepository),
  leaveStudyGroupUseCase: new LeaveStudyGroupUseCase(studyGroupRepository),
  getStudyGroupMembersUseCase: new GetStudyGroupMembersUseCase(studyGroupRepository),
  createStudySessionUseCase: new CreateStudySessionUseCase(studySessionRepository, studyGroupRepository),
  updateStudySessionUseCase: new UpdateStudySessionUseCase(studySessionRepository, studyGroupRepository),
  getStudySessionsUseCase: new GetStudySessionsUseCase(studySessionRepository),
};

export const studySessionCronNotifier = new StudySessionCronNotifier(studySessionRepository, studyGroupRepository, 60000, 18);
studySessionCronNotifier.start();
