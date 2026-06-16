import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { studyGroupRealtimeBus } from '../../../realtime/studyGroupRealtime';
import { StudyGroupResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';
import { studyGroupSubject } from '../../domain/events/studyGroupSubject';
import { StudyGroupEventType } from '../../domain/events/studyGroupEvents';

export interface JoinStudyGroupCommand {
  groupId: string;
  profileId: string;
}

export class JoinStudyGroupUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(command: JoinStudyGroupCommand): Promise<ServiceResult<StudyGroupResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      const isEnrolled = await this.studyGroupRepository.verifyEnrollment(
        command.profileId,
        group.subjectId
      );

      if (!isEnrolled) {
        throw new HttpError(403, 'Forbidden: You are not enrolled in the subject for this group');
      }

      // Validate: user must not already be a member
      const alreadyMember = await this.studyGroupRepository.isMember(
        command.profileId,
        command.groupId
      );
      if (alreadyMember) {
        throw new HttpError(409, 'You are already a member of this group');
      }

      // Validate: user must not already have a pending request
      const alreadyPending = await this.studyGroupRepository.hasPendingRequest(
        command.profileId,
        command.groupId
      );
      if (alreadyPending) {
        throw new HttpError(409, 'You already have a pending request for this group');
      }

      // Create a pending request — admin must accept/reject
      await this.studyGroupRepository.addPendingRequest(command.profileId, command.groupId);

      eventLogger.info('JoinStudyGroupUseCase.execute', 'Join request created (pending approval)', {
        groupId: command.groupId,
        profileId: command.profileId,
      });

      // Emit realtime event so admin sees the new pending request
      const updatedGroup = await this.studyGroupRepository.findDetailById(command.groupId);
      if (updatedGroup) {
        studyGroupRealtimeBus.publishStudyGroupUpdated({
          groupId: command.groupId,
          action: 'join_request_sent',
          requestedUserId: command.profileId,
          actorUserId: command.profileId,
          updatedGroup,
          timestamp: new Date().toISOString(),
        });

        // Disparar Evento de Dominio (Subject -> Observers)
        await studyGroupSubject.notify({
          type: StudyGroupEventType.SOLICITUD_INGRESO,
          groupId: command.groupId,
          actorUserId: command.profileId,
          targetUserId: group.creatorId, // Se notifica al administrador del grupo
          metadata: { updatedGroup }
        });
      }

      return {
        data: {
          ...group,
          isAdmin: false,
          isMember: false, // Not a member yet — pending admin approval
        },
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('JoinStudyGroupUseCase.execute', message, {
        groupId: command.groupId,
        profileId: command.profileId,
      });

      if (err instanceof HttpError) {
        return {
          data: null,
          error: err.message,
          statusCode: err.statusCode,
        };
      }

      return {
        data: null,
        error: 'Failed to send join request',
        statusCode: 500,
      };
    }
  }
}
