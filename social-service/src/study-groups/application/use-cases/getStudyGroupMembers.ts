import { ServiceResult } from '../../../shared/core/serviceResult';
import { GroupMember } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';

export class GetStudyGroupMembersUseCase {
  constructor(private readonly studyGroupRepo: StudyGroupRepositoryPort) {}

  async execute(groupId: string, requesterId: string): Promise<ServiceResult<GroupMember[]>> {
    const isMember = await this.studyGroupRepo.isMember(requesterId, groupId);

    if (!isMember) {
      return {
        success: false,
        error: 'You are not a member of this study group',
        statusCode: 403,
      };
    }

    const members = await this.studyGroupRepo.findMembers(groupId);
    const filteredMembers = members.filter(m => m.id !== requesterId);

    return {
      success: true,
      data: filteredMembers,
      error: null,
      statusCode: 200,
    } as ServiceResult<GroupMember[]>;
  }
}
