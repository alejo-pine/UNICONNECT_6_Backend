import { ServiceResult } from '../../../shared/application/serviceResult';
import { GroupMember } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';

export class GetStudyGroupMembersUseCase {
  constructor(private readonly studyGroupRepo: StudyGroupRepositoryPort) {}

  async execute(groupId: string, requesterId: string): Promise<ServiceResult<GroupMember[]>> {
    const isMember = await this.studyGroupRepo.isMember(requesterId, groupId);

    if (!isMember) {
      return {
        data: null,
        error: 'You are not a member of this study group',
        statusCode: 403,
      };
    }

    const members = await this.studyGroupRepo.findMembers(groupId);
    const filteredMembers = members.filter(m => m.id !== requesterId);

    return {
      data: filteredMembers,
      error: null,
      statusCode: 200,
    };
  }
}
