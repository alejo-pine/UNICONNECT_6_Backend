import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupDetailResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';
import {
  studyGroupRealtimeBus,
  STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT,
  STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT,
} from '../../../realtime/studyGroupRealtime';

export interface RespondAdminTransferCommand {
  groupId: string;
  respondingUserId: string;
  action: 'accept' | 'reject';
}

export class RespondAdminTransferUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(
    command: RespondAdminTransferCommand
  ): Promise<ServiceResult<StudyGroupDetailResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      if (!['accept', 'reject'].includes(command.action)) {
        throw new HttpError(400, 'Field "action" must be "accept" or "reject"');
      }

      const group = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      // Validar que hay una transferencia pendiente
      const pendingTransfer = await this.studyGroupRepository.getPendingAdminTransfer(command.groupId);
      if (!pendingTransfer || pendingTransfer.status !== 'pending') {
        throw new HttpError(409, 'No pending admin transfer for this group');
      }

      // Validar que el usuario respondiendo es el que fue solicitado
      if (pendingTransfer.toUserId !== command.respondingUserId) {
        throw new HttpError(403, 'Forbidden: this transfer request is not for you');
      }

      if (command.action === 'accept') {
        // Aceptar transferencia
        await this.studyGroupRepository.acceptAdminTransfer(command.groupId);

        eventLogger.info('RespondAdminTransferUseCase.execute', 'Admin transfer accepted', {
          groupId: command.groupId,
          fromUserId: pendingTransfer.fromUserId,
          toUserId: command.respondingUserId,
        });

        // Emitir evento real-time
        studyGroupRealtimeBus.emit(STUDY_GROUP_ADMIN_TRANSFER_ACCEPTED_EVENT, {
          groupId: command.groupId,
          fromUserId: pendingTransfer.fromUserId,
          toUserId: command.respondingUserId,
          status: 'accepted',
        });
      } else {
        // Rechazar transferencia
        await this.studyGroupRepository.clearPendingAdminTransfer(command.groupId);

        eventLogger.info('RespondAdminTransferUseCase.execute', 'Admin transfer rejected', {
          groupId: command.groupId,
          fromUserId: pendingTransfer.fromUserId,
          toUserId: command.respondingUserId,
        });

        // Emitir evento real-time
        studyGroupRealtimeBus.emit(STUDY_GROUP_ADMIN_TRANSFER_REJECTED_EVENT, {
          groupId: command.groupId,
          fromUserId: pendingTransfer.fromUserId,
          toUserId: command.respondingUserId,
          status: 'rejected',
        });
      }

      const updatedGroup = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!updatedGroup) {
        throw new HttpError(404, 'Study group not found');
      }

      return {
        data: updatedGroup,
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      eventLogger.error('RespondAdminTransferUseCase.execute', message, {
        groupId: command.groupId,
        respondingUserId: command.respondingUserId,
        action: command.action,
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
        error: message,
        statusCode: 500,
      };
    }
  }
}
