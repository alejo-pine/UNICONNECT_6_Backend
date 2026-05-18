import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { studyGroupRealtimeBus } from '../../../realtime/studyGroupRealtime';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { SubjectRepositoryPort } from '../../domain/ports/subjectRepositoryPort';
import { CreateStudyGroupCommand, ServiceResult } from '../dto/studyGroupDto';

const MAX_GROUPS_PER_SUBJECT = 3;


export class CreateStudyGroupUseCase {
  constructor(
    private readonly studyGroupRepository: StudyGroupRepositoryPort,
    private readonly subjectRepository: SubjectRepositoryPort
  ) {}

  async execute(command: CreateStudyGroupCommand): Promise<ServiceResult<StudyGroupResponse>> {
    try {
      if (!command.name.trim()) {
        throw new HttpError(400, 'Field "name" is required and must be a non-empty string');
      }

      if (!command.description.trim()) {
        throw new HttpError(400, 'Field "description" is required and must be a non-empty string');
      }

      if (!command.subjectId.trim()) {
        throw new HttpError(400, 'Field "subject_id" is required and must be a non-empty string');
      }

      const subjectExists = await this.subjectRepository.exists(command.subjectId);
      if (!subjectExists) {
        throw new HttpError(400, 'Subject does not exist');
      }

      // Business rule: max 3 study groups per subject
      const groupCount = await this.studyGroupRepository.countBySubject(command.subjectId);
      if (groupCount >= MAX_GROUPS_PER_SUBJECT) {
        throw new HttpError(
          409,
          `Cannot create group: the subject already has the maximum of ${MAX_GROUPS_PER_SUBJECT} study groups`
        );
      }

      const studyGroup = await this.studyGroupRepository.create({
        name: command.name.trim(),
        description: command.description.trim(),
        subjectId: command.subjectId.trim(),
        creatorId: command.creatorId,
      });

      const result: ServiceResult<StudyGroupResponse> = {
        data: {
          ...studyGroup,
          isAdmin: true,
          isMember: true,
        },
        error: null,
        statusCode: 201,
      };

      // Emit realtime event so subscribers know a new group was created
      studyGroupRealtimeBus.publishStudyGroupUpdated({
        groupId: studyGroup.id,
        action: 'group_created',
        requestedUserId: command.creatorId,
        actorUserId: command.creatorId,
        updatedGroup: {
          id: studyGroup.id,
          name: studyGroup.name,
          createdBy: studyGroup.creatorId,
          members: [command.creatorId],
          pendingRequests: [],
        },
        timestamp: new Date().toISOString(),
      });

      // BADGES NOTIFICATION LOGIC
      try {
        const userGroupCount = await this.studyGroupRepository.countCreatedGroups(command.creatorId);
        
        const notifyBadge = async (title: string, message: string) => {
          const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005/notifications';
          await fetch(notificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: command.creatorId,
              title,
              message,
              type: 'SISTEMA',
              read: false,
            }),
          });
        };

        if (userGroupCount === 1) {
          await notifyBadge('🚀 Insignia Desbloqueada: Iniciador', 'Creaste tu primer grupo de estudio.');
        } else if (userGroupCount === 5) {
          await notifyBadge('👨‍🏫 Insignia Desbloqueada: Monitor Universitario', 'Has creado 5 grupos de estudio.');
        }
      } catch (badgeError) {
        eventLogger.error('CreateStudyGroupUseCase.badgeCheck', 'Failed to check/notify badges', badgeError);
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('CreateStudyGroupUseCase.execute', message, {
        creatorId: command.creatorId,
      });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      if (message.includes('violates unique constraint') || message.includes('UNIQUE')) {
        return {
          data: null,
          error: 'A study group with this name already exists',
          statusCode: 400,
        };
      }

      return {
        data: null,
        error: 'Failed to create study group',
        statusCode: 500,
      };
    }
  }
}
