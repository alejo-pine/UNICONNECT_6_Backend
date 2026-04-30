import { HttpError } from '../../../utils/httpError';
import { eventLogger } from '../../../utils/eventLogger';
import { StudyGroupDetailResponse } from '../../domain/entities/studyGroup';
import { StudyGroupRepositoryPort } from '../../domain/ports/studyGroupRepositoryPort';
import { ServiceResult } from '../dto/studyGroupDto';
import { studyGroupRealtimeBus, STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT } from '../../../realtime/studyGroupRealtime';
import { studyGroupSubject } from '../../domain/events/studyGroupSubject';
import { StudyGroupEventType } from '../../domain/events/studyGroupEvents';

export interface InitiateAdminTransferCommand {
  groupId: string;
  currentUserId: string;
  newAdminUserId: string;
}

export class InitiateAdminTransferUseCase {
  constructor(private readonly studyGroupRepository: StudyGroupRepositoryPort) {}

  async execute(
    command: InitiateAdminTransferCommand
  ): Promise<ServiceResult<StudyGroupDetailResponse>> {
    try {
      if (!command.groupId.trim()) {
        throw new HttpError(400, 'Field "groupId" is required and must be a non-empty string');
      }

      if (!command.newAdminUserId.trim()) {
        throw new HttpError(400, 'Field "newAdminUserId" is required and must be a non-empty string');
      }

      const group = await this.studyGroupRepository.findDetailById(command.groupId);
      if (!group) {
        throw new HttpError(404, 'Study group not found');
      }

      // Validar que el usuario actual es el admin
      if (group.createdBy !== command.currentUserId) {
        throw new HttpError(403, 'Forbidden: only admin can initiate admin transfer');
      }

      // Validar que no es a sí mismo
      if (group.createdBy === command.newAdminUserId) {
        throw new HttpError(409, 'User is already the group admin');
      }

      // Validar que el nuevo admin existe
      const userExists = await this.studyGroupRepository.userExists(command.newAdminUserId);
      if (!userExists) {
        throw new HttpError(404, 'User not found');
      }

      // Validar que el nuevo admin es miembro del grupo
      const isMember = await this.studyGroupRepository.isMember(command.newAdminUserId, command.groupId);
      if (!isMember) {
        throw new HttpError(409, 'User is not a member of this group');
      }

      // Validar que no hay una transferencia pendiente
      const existingTransfer = await this.studyGroupRepository.getPendingAdminTransfer(command.groupId);
      if (existingTransfer && existingTransfer.status === 'pending') {
        throw new HttpError(409, 'There is already a pending admin transfer for this group');
      }

      // Crear transferencia pendiente
      await this.studyGroupRepository.setPendingAdminTransfer(
        command.groupId,
        command.currentUserId,
        command.newAdminUserId
      );

      eventLogger.info('InitiateAdminTransferUseCase.execute', 'Admin transfer initiated', {
        groupId: command.groupId,
        fromUserId: command.currentUserId,
        toUserId: command.newAdminUserId,
      });

      // Emitir evento real-time
      studyGroupRealtimeBus.emit(STUDY_GROUP_ADMIN_TRANSFER_REQUESTED_EVENT, {
        groupId: command.groupId,
        fromUserId: command.currentUserId,
        toUserId: command.newAdminUserId,
        status: 'pending',
      });

      // Disparar Evento de Dominio (Subject -> Observers)
      await studyGroupSubject.notify({
        type: StudyGroupEventType.TRANSFERENCIA_ADMIN,
        groupId: command.groupId,
        actorUserId: command.currentUserId,
        targetUserId: command.newAdminUserId,
        metadata: { status: 'pending' }
      });

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
      eventLogger.error('InitiateAdminTransferUseCase.execute', message, {
        groupId: command.groupId,
        currentUserId: command.currentUserId,
        newAdminUserId: command.newAdminUserId,
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
